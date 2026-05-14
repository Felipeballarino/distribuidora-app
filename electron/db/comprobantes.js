const { getDB } = require('./connection')

function obtenerUltimoNumero() {
  const db = getDB()
  const fila = db
    .prepare(`SELECT numero FROM comprobantes ORDER BY id DESC LIMIT 1`)
    .get()
  if (!fila) return 1
  const num = parseInt(fila.numero, 10)
  return isNaN(num) ? 1 : num + 1
}

function emitirComprobante({ cliente, items, totales }) {
  const db = getDB()
  const siguiente = obtenerUltimoNumero()
  const numero = String(siguiente).padStart(8, '0')

  const stmt = db.prepare(`
    INSERT INTO comprobantes (numero, cod_cliente, razon_social, total_neto, total_iva, total_final, items)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const resultado = stmt.run([
    numero,
    cliente.cod_cliente,
    cliente.razon_social,
    totales.neto,
    totales.iva,
    totales.total,
    JSON.stringify(items),
  ])

  return { id: resultado.lastInsertRowid, numero }
}

function listarComprobantes() {
  const db = getDB()
  const filas = db
    .prepare(`SELECT * FROM comprobantes ORDER BY id DESC`)
    .all()
  return filas.map((f) => ({ ...f, items: JSON.parse(f.items || '[]') }))
}

module.exports = { emitirComprobante, obtenerUltimoNumero, listarComprobantes }
