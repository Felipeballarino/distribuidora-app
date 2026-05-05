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
    .all(busqueda, busqueda)
}

module.exports = { buscarClientes }
