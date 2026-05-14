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
    .all([busqueda, busqueda, busqueda])
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
    .all([categoria])
}

function listarPrecios() {
  const db = getDB()
  return db
    .prepare(`
      SELECT id, cod_articulo, denominacion, unidad_medida,
             precio_neto, precio_con_iva, categoria, activo
      FROM precios
      ORDER BY categoria, denominacion
    `)
    .all()
}

function crearPrecio({ cod_articulo, denominacion, unidad_medida, precio_neto, precio_con_iva, categoria }) {
  const db = getDB()
  db.prepare(`
    INSERT INTO precios (cod_articulo, denominacion, unidad_medida, precio_neto, precio_con_iva, categoria)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run([
    cod_articulo.trim(),
    denominacion.trim(),
    (unidad_medida || 'unid').trim(),
    parseFloat(precio_neto),
    parseFloat(precio_con_iva),
    (categoria || '').trim(),
  ])
  return { ok: true }
}

function actualizarPrecio(id, { cod_articulo, denominacion, unidad_medida, precio_neto, precio_con_iva, categoria }) {
  const db = getDB()
  db.prepare(`
    UPDATE precios
    SET cod_articulo=?, denominacion=?, unidad_medida=?, precio_neto=?, precio_con_iva=?, categoria=?
    WHERE id=?
  `).run([
    cod_articulo.trim(),
    denominacion.trim(),
    (unidad_medida || 'unid').trim(),
    parseFloat(precio_neto),
    parseFloat(precio_con_iva),
    (categoria || '').trim(),
    id,
  ])
  return { ok: true }
}

function eliminarPrecio(id) {
  const db = getDB()
  db.prepare(`DELETE FROM precios WHERE id=?`).run([id])
  return { ok: true }
}

function importarPrecios(filas) {
  const db = getDB()
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO precios (cod_articulo, denominacion, unidad_medida, precio_neto, precio_con_iva, categoria)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  let importados = 0
  for (const f of filas) {
    const cod = String(f['Código'] || f['Codigo'] || f.cod_articulo || '').trim()
    const den = String(f['Denominación'] || f['Denominacion'] || f.denominacion || '').trim()
    if (!cod || !den) continue
    const pNeto = parseFloat(f['Precio Neto'] || f.precio_neto || 0)
    const pIva = parseFloat(f['Precio c/IVA'] || f['Precio con IVA'] || f.precio_con_iva || pNeto * 1.21)
    stmt.run([
      cod,
      den,
      String(f['Unidad'] || f.unidad_medida || 'unid').trim(),
      pNeto,
      pIva,
      String(f['Categoría'] || f['Categoria'] || f.categoria || '').trim(),
    ])
    importados++
  }
  return { importados }
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
