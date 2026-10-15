const { getDB } = require('./connection')
const { registrarMovimiento, stockActual, cantidadesPorProducto, faltantesDe } = require('./stock')
const { leerConfig } = require('./config')

function obtenerUltimoNumero() {
  const fila = getDB().get(`SELECT MAX(CAST(numero AS INTEGER)) AS ultimo FROM comprobantes`)
  return (fila?.ultimo || 0) + 1
}

// Registra el pedido. Todo en una transacción:
//  1. si está activado "bloquear ventas sin stock", verifica que alcance (si falta, no se guarda nada)
//  2. asigna número correlativo y guarda el pedido
//  3. descuenta el stock registrando un movimiento 'venta' por producto (puede quedar negativo)
//  4. si venía de una precarga, la borra y libera su reserva
// No se calcula IVA: el total es la suma de los subtotales.
function emitirComprobante({ cliente, items, totales, precarga_id = null }) {
  // Nunca se guarda una venta con precio 0
  const sinPrecio = items.filter((i) => !(Number(i.precio_venta ?? i.precio_venta_neto) > 0))
  if (sinPrecio.length > 0) {
    return { ok: false, error: `Hay productos sin precio: ${sinPrecio.map((i) => i.denominacion).join(', ')}` }
  }

  const db = getDB()
  db.exec('BEGIN IMMEDIATE')
  try {
    if (leerConfig(db).bloquear_sin_stock) {
      // La reserva de su propia precarga cuenta como disponible para este pedido
      const faltantes = faltantesDe(db, items, precarga_id)
      if (faltantes.length > 0) {
        db.exec('ROLLBACK')
        return { ok: false, error: 'STOCK_INSUFICIENTE', faltantes }
      }
    }

    const numero = String(obtenerUltimoNumero()).padStart(8, '0')
    const total = Number(totales?.total) || 0

    db.run(
      `INSERT INTO comprobantes (numero, cod_cliente, razon_social, cuit, domicilio,
                                 total_neto, total_iva, total_final, items)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [numero, cliente.cod_cliente, cliente.razon_social, cliente.cuit || '', cliente.domicilio || '',
        total, total, JSON.stringify(items)]
    )

    for (const [cod, cantidad] of cantidadesPorProducto(items)) {
      if (cantidad <= 0) continue
      // Un producto borrado de la lista no tiene stock que descontar
      if (stockActual(db, cod) === null) continue
      registrarMovimiento(db, {
        cod_articulo: cod, tipo: 'venta', cantidad: -cantidad,
        referencia: numero, nota: cliente.razon_social,
      })
    }

    if (precarga_id) {
      db.run(`DELETE FROM reservas WHERE precarga_id = ?`, [precarga_id])
      db.run(`DELETE FROM precargas WHERE id = ?`, [precarga_id])
    }

    db.exec('COMMIT')
    return { ok: true, numero }
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

// Anula un pedido y devuelve la mercadería al stock
function anularComprobante(id) {
  const db = getDB()
  db.exec('BEGIN IMMEDIATE')
  try {
    const c = db.get(`SELECT * FROM comprobantes WHERE id = ?`, [id])
    if (!c) { db.exec('ROLLBACK'); return { ok: false, error: 'No existe el pedido' } }
    if (c.anulado) { db.exec('ROLLBACK'); return { ok: false, error: 'El pedido ya estaba anulado' } }

    // Se devuelve exactamente lo que descontó la venta (así no importa en qué unidad se contaba entonces)
    const vendidos = db.all(
      `SELECT cod_articulo, SUM(cantidad) AS cantidad FROM movimientos_stock
       WHERE tipo = 'venta' AND referencia = ? GROUP BY cod_articulo`,
      [c.numero]
    )
    for (const v of vendidos) {
      const cantidad = -Number(v.cantidad) || 0
      if (cantidad <= 0) continue
      // Si el producto se borró de la lista, no hay stock que devolver
      if (stockActual(db, v.cod_articulo) === null) continue
      registrarMovimiento(db, {
        cod_articulo: v.cod_articulo, tipo: 'anulacion', cantidad,
        referencia: c.numero, nota: `Anulación pedido ${c.numero}`,
      })
    }
    db.run(`UPDATE comprobantes SET anulado = 1 WHERE id = ?`, [id])
    db.exec('COMMIT')
    return { ok: true }
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

function listarComprobantes() {
  const filas = getDB().all(`SELECT * FROM comprobantes ORDER BY id DESC`)
  return filas.map((f) => ({ ...f, anulado: !!f.anulado, items: JSON.parse(f.items || '[]') }))
}

module.exports = { emitirComprobante, anularComprobante, obtenerUltimoNumero, listarComprobantes }
