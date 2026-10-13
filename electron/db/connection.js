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

  console.log('Base de datos inicializada en:', DB_PATH)
  return db
}

function getDB() {
  if (!db) throw new Error('Base de datos no inicializada')
  return db
}

module.exports = { inicializarDB, getDB, DB_PATH }
