const { getDB } = require('./connection')

function buscarProductos(termino) {
  const db = getDB()
  const busqueda = `%${termino}%`
  return db
    .prepare(`
      SELECT id, cod_articulo, denominacion, unidad_medida,
             precio_neto, precio_con_iva, categoria
      FROM precios
      WHERE activo = 1
        AND (denominacion LIKE ? OR cod_articulo LIKE ? OR categoria LIKE ?)
      ORDER BY denominacion
      LIMIT 50
    `)
    .all(busqueda, busqueda, busqueda)
}

function buscarPorCategoria(categoria) {
  const db = getDB()
  if (!categoria || categoria === 'Todos') {
    return db
      .prepare(`
        SELECT id, cod_articulo, denominacion, unidad_medida,
               precio_neto, precio_con_iva, categoria
        FROM precios
        WHERE activo = 1
        ORDER BY categoria, denominacion
        LIMIT 100
      `)
      .all()
  }
  return db
    .prepare(`
      SELECT id, cod_articulo, denominacion, unidad_medida,
             precio_neto, precio_con_iva, categoria
      FROM precios
      WHERE activo = 1 AND categoria = ?
      ORDER BY denominacion
    `)
    .all(categoria)
}

module.exports = { buscarProductos, buscarPorCategoria }
