const { getDB } = require('./connection')
const { cantidadesPorProducto, faltantesDe, disponibleDe, enTransaccion } = require('./stock')
const { leerConfig } = require('./config')

// Precargas: pedidos que el empleado arma el día anterior y se terminan a la mañana
// (cuando pesan y cargan el camión). Reservan la mercadería pero no tienen número,
// no se imprimen y no descuentan stock hasta que se confirman (ver emitirComprobante).

const desdeFila = (f) => ({ ...f, items: JSON.parse(f.items || '[]') })

// Crea o actualiza una precarga y rehace su reserva. Devuelve { ok, id }.
function guardarPrecarga({ id = null, cliente, items, total = 0, margen = 0 }) {
  if (!cliente?.cod_cliente) return { ok: false, error: 'Falta el cliente' }
  const conCantidad = (items || []).filter((i) => Number(i.cantidad) > 0)
  if (conCantidad.length === 0) return { ok: false, error: 'El pedido no tiene productos' }

  return enTransaccion((db) => {
    if (id && !db.get(`SELECT 1 FROM precargas WHERE id = ?`, [id])) {
      return { ok: false, error: 'La precarga ya no existe (¿la terminaron o la descartaron?)' }
    }
    if (leerConfig(db).bloquear_sin_stock) {
      const faltantes = faltantesDe(db, conCantidad, id)
      if (faltantes.length > 0) return { ok: false, error: 'STOCK_INSUFICIENTE', faltantes }
    }

    const datos = [cliente.cod_cliente, cliente.razon_social, cliente.cuit || '', cliente.domicilio || '',
      Number(margen) || 0, JSON.stringify(items), Number(total) || 0]
    let precargaId = id
    if (id) {
      db.run(
        `UPDATE precargas SET cod_cliente=?, razon_social=?, cuit=?, domicilio=?, margen=?, items=?, total=?,
                              actualizado=CURRENT_TIMESTAMP
         WHERE id=?`,
        [...datos, id]
      )
      db.run(`DELETE FROM reservas WHERE precarga_id = ?`, [id])
    } else {
      db.run(
        `INSERT INTO precargas (cod_cliente, razon_social, cuit, domicilio, margen, items, total)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        datos
      )
      precargaId = db.get(`SELECT last_insert_rowid() AS id`).id
    }

    for (const [cod, cantidad] of cantidadesPorProducto(conCantidad)) {
      if (cantidad > 0) {
        db.run(`INSERT INTO reservas (precarga_id, cod_articulo, cantidad) VALUES (?, ?, ?)`, [precargaId, cod, cantidad])
      }
    }
    return { ok: true, id: precargaId }
  })
}

function listarPrecargas() {
  return getDB().all(`SELECT * FROM precargas ORDER BY id`).map(desdeFila)
}

// Para retomarla: el stock de cada ítem se actualiza a lo disponible HOY para esta precarga
// (su propia reserva cuenta como disponible).
function obtenerPrecarga(id) {
  const db = getDB()
  const fila = db.get(`SELECT * FROM precargas WHERE id = ?`, [id])
  if (!fila) return null
  const p = desdeFila(fila)
  p.items = p.items.map((i) => ({ ...i, stock: disponibleDe(db, i.cod_articulo, id) ?? 0 }))
  p.reservas = Object.fromEntries(
    db.all(`SELECT cod_articulo, SUM(cantidad) AS cantidad FROM reservas WHERE precarga_id = ? GROUP BY cod_articulo`, [id])
      .map((r) => [r.cod_articulo, r.cantidad])
  )
  return p
}

function descartarPrecarga(id) {
  return enTransaccion((db) => {
    db.run(`DELETE FROM reservas WHERE precarga_id = ?`, [id])
    db.run(`DELETE FROM precargas WHERE id = ?`, [id])
    return { ok: true }
  })
}

module.exports = { guardarPrecarga, listarPrecargas, obtenerPrecarga, descartarPrecarga }
