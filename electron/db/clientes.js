const { getDB } = require('./connection')

function buscarClientes(termino) {
  const db = getDB()
  const busqueda = `%${termino}%`
  return db
    .prepare(`
      SELECT cod_cliente, razon_social, domicilio, condicion_venta, cuit
      FROM clientes
      WHERE activo = 1
        AND (razon_social LIKE ? OR cod_cliente LIKE ?)
      ORDER BY razon_social
      LIMIT 20
    `)
    .all([busqueda, busqueda])
}

function listarClientes() {
  const db = getDB()
  return db
    .prepare(`
      SELECT id, cod_cliente, razon_social, domicilio, condicion_venta, cuit, activo
      FROM clientes
      ORDER BY razon_social
    `)
    .all()
}

function crearCliente({ cod_cliente, razon_social, domicilio, condicion_venta, cuit }) {
  const db = getDB()
  db.prepare(`
    INSERT INTO clientes (cod_cliente, razon_social, domicilio, condicion_venta, cuit)
    VALUES (?, ?, ?, ?, ?)
  `).run([
    cod_cliente.trim(),
    razon_social.trim(),
    (domicilio || '').trim(),
    (condicion_venta || 'Contado').trim(),
    (cuit || '').trim(),
  ])
  return { ok: true }
}

function actualizarCliente(id, { cod_cliente, razon_social, domicilio, condicion_venta, cuit }) {
  const db = getDB()
  db.prepare(`
    UPDATE clientes
    SET cod_cliente=?, razon_social=?, domicilio=?, condicion_venta=?, cuit=?
    WHERE id=?
  `).run([
    cod_cliente.trim(),
    razon_social.trim(),
    (domicilio || '').trim(),
    (condicion_venta || 'Contado').trim(),
    (cuit || '').trim(),
    id,
  ])
  return { ok: true }
}

function eliminarCliente(id) {
  const db = getDB()
  db.prepare(`DELETE FROM clientes WHERE id=?`).run([id])
  return { ok: true }
}

function importarClientes(filas) {
  const db = getDB()
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO clientes (cod_cliente, razon_social, domicilio, condicion_venta, cuit)
    VALUES (?, ?, ?, ?, ?)
  `)
  let importados = 0
  for (const f of filas) {
    const cod = String(f['Código'] || f['Codigo'] || f.cod_cliente || '').trim()
    const razon = String(f['Razón Social'] || f['Razon Social'] || f.razon_social || '').trim()
    if (!cod || !razon) continue
    stmt.run([
      cod,
      razon,
      String(f['Domicilio'] || f.domicilio || '').trim(),
      String(f['Condición de Venta'] || f['Condicion de Venta'] || f.condicion_venta || 'Contado').trim(),
      String(f['CUIT'] || f.cuit || '').trim(),
    ])
    importados++
  }
  return { importados }
}

module.exports = {
  buscarClientes,
  listarClientes,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
  importarClientes,
}
