const { getDB } = require('./connection')

// Margen para errores de redondeo con decimales (kg)
const EPSILON = 0.0005

const redondear3 = (n) => Math.round((Number(n) || 0) * 1000) / 1000

function stockActual(db, cod_articulo) {
  const fila = db.get(`SELECT stock FROM precios WHERE cod_articulo = ?`, [cod_articulo])
  return fila ? Number(fila.stock) || 0 : null
}

// Registra un movimiento y actualiza el saldo. Debe llamarse DENTRO de una transacción.
function registrarMovimiento(db, { cod_articulo, tipo, cantidad, referencia = null, nota = null }) {
  const actual = stockActual(db, cod_articulo)
  if (actual === null) throw new Error(`Producto inexistente: ${cod_articulo}`)
  const resultante = redondear3(actual + cantidad)
  db.run(`UPDATE precios SET stock = ? WHERE cod_articulo = ?`, [resultante, cod_articulo])
  db.run(
    `INSERT INTO movimientos_stock (cod_articulo, tipo, cantidad, stock_resultante, referencia, nota)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [cod_articulo, tipo, redondear3(cantidad), resultante, referencia, nota]
  )
  return resultante
}

function enTransaccion(fn) {
  const db = getDB()
  db.exec('BEGIN IMMEDIATE')
  try {
    const r = fn(db)
    db.exec('COMMIT')
    return r
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

// Entrada de mercadería (compra, devolución de un cliente, etc.)
function ingresarStock(cod_articulo, cantidad, nota) {
  const c = Number(cantidad)
  if (!(c > 0)) return { ok: false, error: 'La cantidad tiene que ser mayor a 0' }
  const stock = enTransaccion((db) =>
    registrarMovimiento(db, { cod_articulo, tipo: 'ingreso', cantidad: c, nota: nota || null })
  )
  return { ok: true, stock }
}

// Ajuste por conteo: se carga lo que hay realmente y se registra la diferencia
function ajustarStock(cod_articulo, stockContado, nota) {
  const contado = Number(stockContado)
  if (!(contado >= 0)) return { ok: false, error: 'Ingresá la cantidad contada (0 o más)' }
  const stock = enTransaccion((db) => {
    const actual = stockActual(db, cod_articulo)
    if (actual === null) throw new Error(`Producto inexistente: ${cod_articulo}`)
    const diferencia = redondear3(contado - actual)
    if (Math.abs(diferencia) < EPSILON) return actual
    return registrarMovimiento(db, { cod_articulo, tipo: 'ajuste', cantidad: diferencia, nota: nota || 'Ajuste por conteo' })
  })
  return { ok: true, stock }
}

function listarMovimientos(cod_articulo, limite = 300) {
  const db = getDB()
  const base = `SELECT m.*, p.denominacion, p.unidad_medida
                FROM movimientos_stock m LEFT JOIN precios p ON p.cod_articulo = m.cod_articulo`
  return cod_articulo
    ? db.all(`${base} WHERE m.cod_articulo = ? ORDER BY m.id DESC LIMIT ?`, [cod_articulo, limite])
    : db.all(`${base} ORDER BY m.id DESC LIMIT ?`, [limite])
}

module.exports = { registrarMovimiento, ingresarStock, ajustarStock, listarMovimientos, stockActual, EPSILON }
