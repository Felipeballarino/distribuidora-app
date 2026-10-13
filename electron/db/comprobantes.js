const { getDB } = require('./connection')

function obtenerUltimoNumero() {
  const fila = getDB().get(`SELECT MAX(CAST(numero AS INTEGER)) AS ultimo FROM comprobantes`)
  return (fila?.ultimo || 0) + 1
}

// Registra el pedido. Todo dentro de una transacción: número correlativo,
// alta del comprobante y descuento de stock (solo en productos que tienen stock cargado).
// No se calcula IVA: el total es la suma de los subtotales.
function emitirComprobante({ cliente, items, totales }) {
  const db = getDB()
  db.exec('BEGIN IMMEDIATE')
  try {
    const numero = String(obtenerUltimoNumero()).padStart(8, '0')
    const total = Number(totales?.total) || 0

    db.run(
      `INSERT INTO comprobantes (numero, cod_cliente, razon_social, cuit, domicilio,
                                 total_neto, total_iva, total_final, items)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [
        numero,
        cliente.cod_cliente,
        cliente.razon_social,
        cliente.cuit || '',
        cliente.domicilio || '',
        total,
        total,
        JSON.stringify(items),
      ]
    )

    for (const item of items) {
      const cantidad = Number(item.cantidad) || 0
      if (cantidad <= 0) continue
      db.run(
        `UPDATE precios SET stock = stock - ? WHERE cod_articulo = ? AND stock IS NOT NULL`,
        [cantidad, item.cod_articulo]
      )
    }

    db.exec('COMMIT')
    return { numero }
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

function listarComprobantes() {
  const filas = getDB().all(`SELECT * FROM comprobantes ORDER BY id DESC`)
  return filas.map((f) => ({ ...f, items: JSON.parse(f.items || '[]') }))
}

module.exports = { emitirComprobante, obtenerUltimoNumero, listarComprobantes }
