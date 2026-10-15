const { getDB } = require('./connection')

// STOCK: se cuenta como se guarda en el galpón, no como se cobra.
//   - por unidad                     → unidades
//   - por kg CON peso promedio       → piezas (una barra es 1, pese lo que pese; se cobra por kg)
//   - por kg SIN peso promedio       → kg (fraccionado / suelto)

// Margen para errores de redondeo con decimales (kg)
const EPSILON = 0.0005

const redondear3 = (n) => Math.round((Number(n) || 0) * 1000) / 1000

function stockActual(db, cod_articulo) {
  const fila = db.get(`SELECT stock FROM precios WHERE cod_articulo = ?`, [cod_articulo])
  return fila ? Number(fila.stock) || 0 : null
}

// Mercadería reservada por precargas (opcionalmente sin contar una precarga: la que se está editando)
function reservadoDe(db, cod_articulo, excluirPrecargaId = null) {
  const fila = db.get(
    `SELECT COALESCE(SUM(cantidad), 0) AS total FROM reservas WHERE cod_articulo = ? AND precarga_id IS NOT ?`,
    [cod_articulo, excluirPrecargaId]
  )
  return Number(fila?.total) || 0
}

// Disponible para vender = stock físico - lo reservado por otras precargas
function disponibleDe(db, cod_articulo, excluirPrecargaId = null) {
  const stock = stockActual(db, cod_articulo)
  if (stock === null) return null
  return redondear3(stock - reservadoDe(db, cod_articulo, excluirPrecargaId))
}

// 'kg' si el producto se cuenta en kilos (suelto), 'u' si en piezas/unidades
function unidadStockDe(producto) {
  return producto?.unidad_medida === 'kg' && !(Number(producto?.peso_promedio_kg) > 0) ? 'kg' : 'u'
}

// Lo que un ítem de pedido descuenta del stock.
// Ítems nuevos traen `cantidad_stock`; para los viejos se deduce de su tipo.
function cantidadStockDeItem(item) {
  if (item.cantidad_stock !== undefined && item.cantidad_stock !== null) return Number(item.cantidad_stock) || 0
  if (item.tipo === 'piezas' || item.tipo === 'unidad') return Number(item.unidades) || 0
  if (item.tipo === 'suelto') return Number(item.peso_kg) || 0
  return Number(item.cantidad) || 0
}

// Suma lo que se descuenta del stock por producto (por si un producto viniera repetido)
function cantidadesPorProducto(items) {
  const mapa = new Map()
  for (const item of items) {
    const c = cantidadStockDeItem(item)
    mapa.set(item.cod_articulo, (mapa.get(item.cod_articulo) || 0) + c)
  }
  return mapa
}

// Productos cuyo pedido supera lo disponible. Lista vacía = alcanza para todo.
function faltantesDe(db, items, excluirPrecargaId = null) {
  const faltantes = []
  for (const [cod, cantidad] of cantidadesPorProducto(items)) {
    const disponible = disponibleDe(db, cod, excluirPrecargaId) ?? 0
    if (cantidad > disponible + EPSILON) {
      const item = items.find((i) => i.cod_articulo === cod)
      faltantes.push({ cod_articulo: cod, denominacion: item?.denominacion, pedido: cantidad, disponible })
    }
  }
  return faltantes
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
  const base = `SELECT m.*, p.denominacion, p.unidad_medida, p.peso_promedio_kg
                FROM movimientos_stock m LEFT JOIN precios p ON p.cod_articulo = m.cod_articulo`
  return cod_articulo
    ? db.all(`${base} WHERE m.cod_articulo = ? ORDER BY m.id DESC LIMIT ?`, [cod_articulo, limite])
    : db.all(`${base} ORDER BY m.id DESC LIMIT ?`, [limite])
}

// Si cambia cómo se cuenta un producto (le agregan o le sacan el peso promedio), convierte el stock:
// kg → piezas (dividiendo por el peso promedio) o piezas → kg (multiplicando). Va DENTRO de una transacción.
function convertirStockSiCambiaUnidad(db, cod_articulo, antes, despues) {
  const de = unidadStockDe(antes)
  const a = unidadStockDe(despues)
  if (de === a) return
  const stock = stockActual(db, cod_articulo)
  if (stock === null) return
  let nuevo = null
  if (de === 'kg' && Number(despues.peso_promedio_kg) > 0) nuevo = Math.round(stock / Number(despues.peso_promedio_kg))
  if (a === 'kg' && Number(antes.peso_promedio_kg) > 0) nuevo = redondear3(stock * Number(antes.peso_promedio_kg))
  if (nuevo === null) return // ej: de unidad a kg suelto: no hay forma de convertir
  db.run(`UPDATE precios SET stock = ? WHERE cod_articulo = ?`, [nuevo, cod_articulo])
  db.run(
    `INSERT INTO movimientos_stock (cod_articulo, tipo, cantidad, stock_resultante, nota) VALUES (?, 'ajuste', 0, ?, ?)`,
    [cod_articulo, nuevo, a === 'kg' ? `Pasa a contarse en kg (antes ${stock} piezas)` : `Pasa a contarse en piezas (antes ${stock} kg)`]
  )
}

module.exports = {
  unidadStockDe, cantidadStockDeItem, convertirStockSiCambiaUnidad,
  registrarMovimiento, ingresarStock, ajustarStock, listarMovimientos, stockActual,
  reservadoDe, disponibleDe, cantidadesPorProducto, faltantesDe, enTransaccion, EPSILON,
}
