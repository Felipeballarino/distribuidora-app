const { getDB } = require('./connection')
const { registrarMovimiento, convertirStockSiCambiaUnidad } = require('./stock')
const { palabrasDe, coincide } = require('./busqueda')

// Nota: en la tabla `precios`, la columna `precio_neto` es el COSTO del producto.
// El precio de venta se calcula en cada pedido aplicando el margen elegido.
// `precio_con_iva` quedó de una versión anterior (NOT NULL): se guarda igual al costo.
// No se muestra IVA en ningún lado.
//
// STOCK: no se edita desde acá. Solo se carga un stock inicial al crear el producto.
// Después cambia únicamente por movimientos (ventas, ingresos, ajustes, anulaciones): ver stock.js.

// `stock` es el físico; `reservado` lo apartado por precargas. Disponible = stock - reservado.
const COLUMNAS = `id, cod_articulo, denominacion, marca, unidad_medida, peso_promedio_kg,
                  precio_neto, stock, categoria,
                  (SELECT COALESCE(SUM(r.cantidad), 0) FROM reservas r
                    WHERE r.cod_articulo = precios.cod_articulo) AS reservado`

// Acepta números de Excel y texto en formato argentino: "4.500" = 4500, "4,5" = 4.5, "1.234,56"
function aNumeroONull(valor) {
  if (valor === null || valor === undefined || valor === '') return null
  if (typeof valor === 'number') return isNaN(valor) ? null : valor
  let t = String(valor).trim().replace(/[$\s]/g, '')
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.')
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '')
  const n = parseFloat(t)
  return isNaN(n) ? null : n
}

function normalizarUnidad(valor) {
  const u = String(valor || '').trim().toLowerCase()
  return u === 'kg' || u === 'kilo' || u === 'kilos' ? 'kg' : 'unid'
}

function buscarProductos(termino) {
  const palabras = palabrasDe(termino)
  if (palabras.length === 0) return buscarPorCategoria('Todos')
  // Cada palabra por separado y sin acentos: "cremoso queso" encuentra "Queso Cremoso"
  return getDB()
    .all(`SELECT ${COLUMNAS} FROM precios WHERE activo = 1 ORDER BY denominacion`)
    .filter((p) => coincide(p, ['denominacion', 'cod_articulo', 'marca', 'categoria'], palabras))
    .slice(0, 50)
}

function buscarPorCategoria(categoria) {
  const db = getDB()
  if (!categoria || categoria === 'Todos') {
    return db.all(
      `SELECT ${COLUMNAS} FROM precios WHERE activo = 1 ORDER BY categoria, denominacion LIMIT 300`
    )
  }
  return db.all(
    `SELECT ${COLUMNAS} FROM precios WHERE activo = 1 AND categoria = ? ORDER BY denominacion`,
    [categoria]
  )
}

function listarPrecios() {
  return getDB().all(`SELECT ${COLUMNAS}, activo FROM precios ORDER BY categoria, denominacion`)
}

function valoresProducto(datos) {
  const unidad = normalizarUnidad(datos.unidad_medida)
  const costo = aNumeroONull(datos.precio_neto) ?? 0
  return [
    String(datos.cod_articulo || '').trim(),
    String(datos.denominacion || '').trim(),
    String(datos.marca || '').trim(),
    unidad,
    // el peso promedio solo tiene sentido en productos que se venden por kg
    unidad === 'kg' ? aNumeroONull(datos.peso_promedio_kg) : null,
    costo,
    costo,
    String(datos.categoria || '').trim(),
  ]
}

const INSERT_PRODUCTO = `INSERT INTO precios (cod_articulo, denominacion, marca, unidad_medida, peso_promedio_kg,
                          precio_neto, precio_con_iva, categoria, stock)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`

function crearPrecio(datos) {
  const db = getDB()
  const valores = valoresProducto(datos)
  if (db.get(`SELECT 1 FROM precios WHERE cod_articulo = ?`, [valores[0]])) {
    return { ok: false, error: `Ya existe un producto con el código ${valores[0]}` }
  }
  db.exec('BEGIN IMMEDIATE')
  try {
    db.run(INSERT_PRODUCTO, valores)
    const inicial = aNumeroONull(datos.stock)
    if (inicial > 0) {
      registrarMovimiento(db, { cod_articulo: valores[0], tipo: 'inicial', cantidad: inicial, nota: 'Stock inicial' })
    }
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
  return { ok: true }
}

// Si le agregan o sacan el peso promedio, el stock pasa de kg a piezas (o al revés) y se convierte.
function actualizarPrecio(id, datos) {
  const db = getDB()
  const valores = valoresProducto(datos)
  db.exec('BEGIN IMMEDIATE')
  try {
    const antes = db.get(`SELECT unidad_medida, peso_promedio_kg FROM precios WHERE id = ?`, [id])
    db.run(
      `UPDATE precios
       SET cod_articulo=?, denominacion=?, marca=?, unidad_medida=?, peso_promedio_kg=?,
           precio_neto=?, precio_con_iva=?, categoria=?,
           fecha_actualizacion=CURRENT_TIMESTAMP
       WHERE id=?`,
      [...valores, id]
    )
    if (antes) {
      convertirStockSiCambiaUnidad(db, valores[0], antes, { unidad_medida: valores[3], peso_promedio_kg: valores[4] })
    }
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
  return { ok: true }
}

function eliminarPrecio(id) {
  getDB().run(`DELETE FROM precios WHERE id=?`, [id])
  return { ok: true }
}

// Importa desde Excel. Si el código ya existe, ACTUALIZA el producto (no lo duplica).
// La columna Stock solo se usa como stock inicial de productos NUEVOS (en piezas/unidades; en kg si es fraccionado):
// reimportar la lista de precios nunca pisa el stock que lleva el sistema.
function importarPrecios(filas) {
  const db = getDB()
  let importados = 0
  let nuevos = 0
  const sinCosto = []
  db.exec('BEGIN IMMEDIATE')
  try {
    for (const f of filas) {
      const datos = {
        cod_articulo: f['Código'] ?? f['Codigo'] ?? f.cod_articulo,
        denominacion: f['Denominación'] ?? f['Denominacion'] ?? f.denominacion,
        marca: f['Marca'] ?? f.marca,
        unidad_medida: f['Unidad'] ?? f['Se vende por'] ?? f.unidad_medida,
        peso_promedio_kg: f['Peso promedio'] ?? f['Peso promedio (kg)'] ?? f.peso_promedio_kg,
        precio_neto: f['Costo'] ?? f['Precio'] ?? f['Precio Neto'] ?? f.precio_neto,
        categoria: f['Categoría'] ?? f['Categoria'] ?? f.categoria,
      }
      const valores = valoresProducto(datos)
      if (!valores[0] || !valores[1]) continue
      if (!(valores[5] > 0)) sinCosto.push(valores[1])
      const existente = db.get(`SELECT unidad_medida, peso_promedio_kg FROM precios WHERE cod_articulo = ?`, [valores[0]])
      if (existente) {
        db.run(
          `UPDATE precios SET denominacion=?, marca=?, unidad_medida=?, peso_promedio_kg=?,
             precio_neto=?, precio_con_iva=?, categoria=?, activo=1, fecha_actualizacion=CURRENT_TIMESTAMP
           WHERE cod_articulo=?`,
          [...valores.slice(1), valores[0]]
        )
        convertirStockSiCambiaUnidad(db, valores[0], existente, { unidad_medida: valores[3], peso_promedio_kg: valores[4] })
      } else {
        db.run(INSERT_PRODUCTO, valores)
        const inicial = aNumeroONull(f['Stock'] ?? f.stock)
        if (inicial > 0) {
          registrarMovimiento(db, { cod_articulo: valores[0], tipo: 'inicial', cantidad: inicial, nota: 'Stock inicial (Excel)' })
        }
        nuevos++
      }
      importados++
    }
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
  return { importados, nuevos, sinCosto }
}

// Aumento (o baja) de costos por marca o categoría. Ej: { criterio: 'marca', valor: 'La Quesera', porcentaje: 15 }
// Todo en una transacción y queda registrado en aumentos_precios.
function aumentarCostos({ criterio, valor, porcentaje }) {
  const columna = criterio === 'categoria' ? 'categoria' : criterio === 'marca' ? 'marca' : null
  if (!columna) return { ok: false, error: 'Elegí si es por marca o por categoría' }
  const nombre = String(valor || '').trim()
  if (!nombre) return { ok: false, error: `Elegí la ${columna}` }
  const pct = aNumeroONull(porcentaje)
  if (pct === null || pct === 0) return { ok: false, error: 'Ingresá el porcentaje' }
  if (pct <= -100) return { ok: false, error: 'El porcentaje no puede bajar el costo a 0 o menos' }

  const db = getDB()
  const filtro = `LOWER(TRIM(${columna})) = LOWER(TRIM(?))`
  db.exec('BEGIN IMMEDIATE')
  try {
    const { cantidad } = db.get(`SELECT COUNT(*) AS cantidad FROM precios WHERE ${filtro}`, [nombre])
    if (!cantidad) {
      db.exec('ROLLBACK')
      return { ok: false, error: `No hay productos de ${nombre}` }
    }
    db.run(
      `UPDATE precios
       SET precio_neto = ROUND(precio_neto * (1 + ? / 100.0), 2),
           precio_con_iva = ROUND(precio_neto * (1 + ? / 100.0), 2),
           fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE ${filtro}`,
      [pct, pct, nombre]
    )
    db.run(`INSERT INTO aumentos_precios (criterio, valor, porcentaje, productos) VALUES (?, ?, ?, ?)`,
      [columna, nombre, pct, cantidad])
    db.exec('COMMIT')
    return { ok: true, productos: cantidad }
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

function listarAumentos(limite = 50) {
  return getDB().all(`SELECT * FROM aumentos_precios ORDER BY id DESC LIMIT ?`, [limite])
}

module.exports = {
  aumentarCostos,
  listarAumentos,
  buscarProductos,
  buscarPorCategoria,
  listarPrecios,
  crearPrecio,
  actualizarPrecio,
  eliminarPrecio,
  importarPrecios,
}
