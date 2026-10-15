const { Database } = require('node-sqlite3-wasm')
const { app } = require('electron')
const path = require('path')
const fs = require('fs')

// En producción guarda en AppData del usuario; en dev usa la carpeta local
const DB_PATH = process.env.LOCAL_DB_PATH ||
  (app.isPackaged
    ? path.join(app.getPath('userData'), 'distribuidora.db')
    : path.join(__dirname, '../../data/distribuidora.db'))

let db = null

function inicializarDB() {
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  db = new Database(DB_PATH)

  db.exec(`
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cod_cliente TEXT UNIQUE NOT NULL,
      razon_social TEXT NOT NULL,
      domicilio TEXT,
      localidad TEXT,
      telefono TEXT,
      email TEXT,
      cuit TEXT,
      activo INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS precios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cod_articulo TEXT NOT NULL,
      denominacion TEXT NOT NULL,
      marca TEXT,
      unidad_medida TEXT DEFAULT 'unid',
      precio_neto REAL NOT NULL,
      precio_con_iva REAL NOT NULL,
      stock INTEGER,
      categoria TEXT,
      activo INTEGER DEFAULT 1,
      fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS comprobantes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero TEXT NOT NULL,
      cod_cliente TEXT NOT NULL,
      razon_social TEXT NOT NULL,
      cuit TEXT,
      domicilio TEXT,
      fecha TEXT DEFAULT CURRENT_TIMESTAMP,
      total_neto REAL,
      total_iva REAL,
      total_final REAL,
      items TEXT
    );
  `)

  // Migraciones: agregar columnas nuevas si la tabla ya existía
  const migraciones = [
    `ALTER TABLE clientes ADD COLUMN localidad TEXT`,
    `ALTER TABLE clientes ADD COLUMN telefono TEXT`,
    `ALTER TABLE clientes ADD COLUMN email TEXT`,
    `ALTER TABLE precios ADD COLUMN marca TEXT`,
    `ALTER TABLE precios ADD COLUMN stock INTEGER`,
    `ALTER TABLE comprobantes ADD COLUMN cuit TEXT`,
    `ALTER TABLE comprobantes ADD COLUMN domicilio TEXT`,
  ]
  for (const sql of migraciones) {
    try { db.exec(sql) } catch (_) { /* columna ya existe, ignorar */ }
  }

  // Peso promedio por pieza (kg). Si un producto se vende por kg y tiene este dato,
  // al cargar unidades el sistema calcula los kg solo (ej: 10 barras x 4,5 = 45 kg).
  try { db.exec(`ALTER TABLE precios ADD COLUMN peso_promedio_kg REAL`) } catch (_) { /* ya existe */ }

  // Limpieza: importaciones viejas duplicaban productos (no había índice único).
  // Se conserva el registro más reciente de cada código y se crea el índice.
  try {
    db.exec(`
      DELETE FROM precios
      WHERE id NOT IN (SELECT MAX(id) FROM precios GROUP BY cod_articulo);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_precios_cod ON precios(cod_articulo);
    `)
  } catch (error) {
    console.error('No se pudo crear el índice único de productos:', error)
  }

  // ── Control de stock ──────────────────────────────────────────────────────
  // Cada cambio de stock queda registrado en movimientos_stock (la "cuenta").
  // precios.stock guarda el saldo actual y se actualiza en la misma transacción.
  // El stock se cuenta en piezas/unidades; solo el fraccionado (kg sin peso promedio) se cuenta en kg.
  db.exec(`
    CREATE TABLE IF NOT EXISTS movimientos_stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT DEFAULT CURRENT_TIMESTAMP,
      cod_articulo TEXT NOT NULL,
      tipo TEXT NOT NULL,            -- inicial | ingreso | venta | ajuste | anulacion
      cantidad REAL NOT NULL,        -- positiva entra, negativa sale
      stock_resultante REAL NOT NULL,
      referencia TEXT,               -- ej: número de pedido
      nota TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_mov_articulo ON movimientos_stock(cod_articulo, id);
  `)
  try { db.exec(`ALTER TABLE comprobantes ADD COLUMN anulado INTEGER DEFAULT 0`) } catch (_) { /* ya existe */ }
  // Sin stock cargado = 0 (no se puede vender hasta que se ingrese mercadería)
  db.exec(`UPDATE precios SET stock = 0 WHERE stock IS NULL`)

  // ── Configuración ─────────────────────────────────────────────────────────
  // bloquear_sin_stock: '1' = no deja vender más de lo disponible; '0' = deja vender igual
  // (el stock puede quedar negativo). Arranca apagado hasta que carguen el stock real.
  db.exec(`
    CREATE TABLE IF NOT EXISTS config (clave TEXT PRIMARY KEY, valor TEXT);
    INSERT OR IGNORE INTO config (clave, valor) VALUES ('bloquear_sin_stock', '0');
  `)

  // ── Precargas ─────────────────────────────────────────────────────────────
  // Pedidos que se arman el día anterior y se terminan a la mañana.
  // Reservan mercadería: disponible = stock - reservado (reservas de todas las precargas).
  // El stock físico (precios.stock) no cambia hasta que el pedido se confirma.
  db.exec(`
    CREATE TABLE IF NOT EXISTS precargas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cod_cliente TEXT NOT NULL,
      razon_social TEXT NOT NULL,
      cuit TEXT,
      domicilio TEXT,
      margen REAL DEFAULT 0,
      items TEXT NOT NULL,
      total REAL DEFAULT 0,
      creado TEXT DEFAULT CURRENT_TIMESTAMP,
      actualizado TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS reservas (
      precarga_id INTEGER NOT NULL,
      cod_articulo TEXT NOT NULL,
      cantidad REAL NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_reservas_articulo ON reservas(cod_articulo);
    CREATE INDEX IF NOT EXISTS idx_reservas_precarga ON reservas(precarga_id);
  `)

  // ── Aumentos de costos masivos (por marca o categoría) ─────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS aumentos_precios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT DEFAULT CURRENT_TIMESTAMP,
      criterio TEXT NOT NULL,        -- marca | categoria
      valor TEXT NOT NULL,
      porcentaje REAL NOT NULL,
      productos INTEGER NOT NULL
    );
  `)

  migrarStockAPiezas(db)

  try {
    db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_comprobantes_numero ON comprobantes(numero)`)
  } catch (error) {
    console.error('No se pudo crear el índice único de comprobantes:', error)
  }

  console.log('Base de datos inicializada en:', DB_PATH)
  return db
}

// Migración (oct 2026): el stock de los productos por kg CON peso promedio (barras, hormas, piezas)
// pasa de contarse en kg a contarse en piezas: piezas = kg / peso promedio, redondeado.
// Las reservas de precargas se recalculan con el mismo criterio. Corre una sola vez.
function migrarStockAPiezas(db) {
  if (db.get(`SELECT 1 FROM config WHERE clave = 'stock_en_piezas'`)) return
  db.exec('BEGIN IMMEDIATE')
  try {
    const productos = db.all(
      `SELECT cod_articulo, stock, peso_promedio_kg FROM precios
       WHERE unidad_medida = 'kg' AND peso_promedio_kg > 0`
    )
    for (const p of productos) {
      const kg = Number(p.stock) || 0
      const piezas = Math.round(kg / Number(p.peso_promedio_kg))
      db.run(`UPDATE precios SET stock = ? WHERE cod_articulo = ?`, [piezas, p.cod_articulo])
      if (kg !== 0) {
        db.run(
          `INSERT INTO movimientos_stock (cod_articulo, tipo, cantidad, stock_resultante, nota)
           VALUES (?, 'ajuste', 0, ?, ?)`,
          [p.cod_articulo, piezas, `Stock pasado de kg a piezas (antes ${kg} kg). Conviene contar.`]
        )
      }
    }
    // Reservas de precargas: piezas para estos productos
    const conPeso = new Set(productos.map((p) => p.cod_articulo))
    for (const pc of db.all(`SELECT id, items FROM precargas`)) {
      for (const item of JSON.parse(pc.items || '[]')) {
        if (!conPeso.has(item.cod_articulo)) continue
        db.run(`UPDATE reservas SET cantidad = ? WHERE precarga_id = ? AND cod_articulo = ?`,
          [Number(item.unidades) || 0, pc.id, item.cod_articulo])
      }
    }
    db.run(`INSERT INTO config (clave, valor) VALUES ('stock_en_piezas', '1')`)
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    console.error('No se pudo pasar el stock a piezas:', error)
  }
}

function getDB() {
  if (!db) throw new Error('Base de datos no inicializada')
  return db
}

module.exports = { inicializarDB, getDB, DB_PATH, migrarStockAPiezas }
