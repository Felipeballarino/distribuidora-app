const { getDB } = require('./connection')
const { registrarMovimiento, stockActual, EPSILON } = require('./stock')

function obtenerUltimoNumero() {
  const fila = getDB().get(`SELECT MAX(CAST(numero AS INTEGER)) AS ultimo FROM comprobantes`)
  return (fila?.ultimo || 0) + 1
}

// Registra el pedido. Todo en una transacción:
//  1. verifica que haya stock de cada producto (si falta, no se guarda nada)
//  2. asigna número correlativo y guarda el pedido
//  3. descuenta el stock registrando un movimiento 'venta' por producto
// No se calcula IVA: el total es la suma de los subtotales.
function emitirComprobante({ cliente, items, totales }) {
  const db = getDB()
  db.exec('BEGIN IMMEDIATE')
  try {
    // Sumar por producto (por si un producto viniera repetido)
    const pedidoPorProducto = new Map()
    for (const item of items) {
      const c = Number(item.cantidad) || 0
      pedidoPorProducto.set(item.cod_articulo, (pedidoPorProducto.get(item.cod_articulo) || 0) + c)
    }

    const faltantes = []
    for (const [cod, cantidad] of pedidoPorProducto) {
      const disponible = stockActual(db, cod) ?? 0
      if (cantidad > disponible + EPSILON) {
        const item = items.find((i) => i.cod_articulo === cod)
        faltantes.push({ cod_articulo: cod, denominacion: item?.denominacion, pedido: cantidad, disponible })
      }
    }
    if (faltantes.length > 0) {
      db.exec('ROLLBACK')
      return { ok: false, error: 'STOCK_INSUFICIENTE', faltantes }
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

    for (const [cod, cantidad] of pedidoPorProducto) {
      if (cantidad <= 0) continue
      registrarMovimiento(db, {
        cod_articulo: cod, tipo: 'venta', cantidad: -cantidad,
        referencia: numero, nota: cliente.razon_social,
      })
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

    for (const item of JSON.parse(c.items || '[]')) {
      const cantidad = Number(item.cantidad) || 0
      if (cantidad <= 0) continue
      // Si el producto se borró de la lista, no hay stock que devolver
      if (stockActual(db, item.cod_articulo) === null) continue
      registrarMovimiento(db, {
        cod_articulo: item.cod_articulo, tipo: 'anulacion', cantidad,
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
