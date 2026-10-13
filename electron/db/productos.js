const { getDB } = require('./connection')
const { registrarMovimiento } = require('./stock')

// Nota: en la tabla `precios`, la columna `precio_neto` es el COSTO del producto.
// El precio de venta se calcula en cada pedido aplicando el margen elegido.
// `precio_con_iva` quedó de una versión anterior (NOT NULL): se guarda igual al costo.
// No se muestra IVA en ningún lado.
//
// STOCK: no se edita desde acá. Solo se carga un stock inicial al crear el producto.
// Después cambia únicamente por movimientos (ventas, ingresos, ajustes, anulaciones): ver stock.js.

const COLUMNAS = `id, cod_articulo, denominacion, marca, unidad_medida, peso_promedio_kg,
                  precio_neto, stock, categoria`

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
  const db = getDB()
  // Busca cada palabra por separado: "cremoso queso" encuentra "Queso Cremoso"
  const palabras = String(termino || '').trim().split(/\s+/).filter(Boolean)
  if (palabras.length === 0) return buscarPorCategoria('Todos')

  const condiciones = palabras.map(
    () => `(denominacion LIKE ? OR cod_articulo LIKE ? OR marca LIKE ? OR categoria LIKE ?)`
  )
  const valores = palabras.flatMap((p) => {
    const t = `%${p}%`
    return [t, t, t, t]
  })
  return db.all(
    `SELECT ${COLUMNAS} FROM precios
     WHERE activo = 1 AND ${condiciones.join(' AND ')}
     ORDER BY denominacion
     LIMIT 50`,
    valores
  )
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

function actualizarPrecio(id, datos) {
  getDB().run(
    `UPDATE precios
     SET cod_articulo=?, denominacion=?, marca=?, unidad_medida=?, peso_promedio_kg=?,
         precio_neto=?, precio_con_iva=?, categoria=?,
         fecha_actualizacion=CURRENT_TIMESTAMP
     WHERE id=?`,
    [...valoresProducto(datos), id]
  )
  return { ok: true }
}

function eliminarPrecio(id) {
  getDB().run(`DELETE FROM precios WHERE id=?`, [id])
  return { ok: true }
}

// Importa desde Excel. Si el código ya existe, ACTUALIZA el producto (no lo duplica).
// La columna Stock solo se usa como stock inicial de productos NUEVOS:
// reimportar la lista de precios nunca pisa el stock que lleva el sistema.
function importarPrecios(filas) {
  const db = getDB()
  let importados = 0
  let nuevos = 0
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
      const existe = !!db.get(`SELECT 1 FROM precios WHERE cod_articulo = ?`, [valores[0]])
      if (existe) {
        db.run(
          `UPDATE precios SET denominacion=?, marca=?, unidad_medida=?, peso_promedio_kg=?,
             precio_neto=?, precio_con_iva=?, categoria=?, activo=1, fecha_actualizacion=CURRENT_TIMESTAMP
           WHERE cod_articulo=?`,
          [...valores.slice(1), valores[0]]
        )
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
  return { importados, nuevos }
}

module.exports = {
  buscarProductos,
  buscarPorCategoria,
  listarPrecios,
  crearPrecio,
  actualizarPrecio,
  eliminarPrecio,
  importarPrecios,
}
