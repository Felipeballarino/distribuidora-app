const { getDB } = require('./connection')

function buscarClientes(termino) {
  const db = getDB()
  const busqueda = `%${termino}%`
  return db
    .prepare(`
      SELECT cod_cliente, razon_social, domicilio, localidad, telefono, email, cuit
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
      SELECT id, cod_cliente, razon_social, domicilio, localidad, telefono, email, cuit, activo
      FROM clientes
      ORDER BY razon_social
    `)
    .all()
}

function crearCliente({ cod_cliente, razon_social, domicilio, localidad, telefono, email, cuit }) {
  const db = getDB()
  db.prepare(`
    INSERT INTO clientes (cod_cliente, razon_social, domicilio, localidad, telefono, email, cuit)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run([
    cod_cliente.trim(),
    razon_social.trim(),
    (domicilio || '').trim(),
    (localidad || '').trim(),
    (telefono || '').trim(),
    (email || '').trim(),
    (cuit || '').trim(),
  ])
  return { ok: true }
}

function actualizarCliente(id, { cod_cliente, razon_social, domicilio, localidad, telefono, email, cuit }) {
  const db = getDB()
  db.prepare(`
    UPDATE clientes
    SET cod_cliente=?, razon_social=?, domicilio=?, localidad=?, telefono=?, email=?, cuit=?
    WHERE id=?
  `).run([
    cod_cliente.trim(),
    razon_social.trim(),
    (domicilio || '').trim(),
    (localidad || '').trim(),
    (telefono || '').trim(),
    (email || '').trim(),
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
    INSERT OR REPLACE INTO clientes (cod_cliente, razon_social, domicilio, localidad, telefono, email, cuit)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  let importados = 0
  for (const f of filas) {
    const cod = String(f.cod_cliente || '').trim()
    const razon = String(f.razon_social || '').trim()
    if (!cod || !razon) continue
    stmt.run([
      cod,
      razon,
      String(f.domicilio || '').trim(),
      String(f.localidad || '').trim(),
      String(f.telefono || '').trim(),
      String(f.email || '').trim(),
      String(f.cuit || '').trim(),
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
