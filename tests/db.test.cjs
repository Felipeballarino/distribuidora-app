// Tests de la capa de base de datos (SQLite real en un archivo temporal).
const { test, before } = require('node:test')
const assert = require('node:assert/strict')
const Module = require('module')
const path = require('path')
const os = require('os')
const fs = require('fs')

// Simular el módulo 'electron' fuera de Electron
const cargaOriginal = Module._load
Module._load = function (req, ...resto) {
  if (req === 'electron') return { app: { isPackaged: false, getPath: () => os.tmpdir() } }
  return cargaOriginal.call(this, req, ...resto)
}
process.env.LOCAL_DB_PATH = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'distri-')), 'test.db')
console.log = () => {}

const conexion = require('../electron/db/connection')
const P = require('../electron/db/productos')
const C = require('../electron/db/comprobantes')
const S = require('../electron/db/stock')
const PC = require('../electron/db/precargas')
const CFG = require('../electron/db/config')

const stockDe = (cod) => P.listarPrecios().find((p) => p.cod_articulo === cod).stock
const productoDe = (cod) => P.listarPrecios().find((p) => p.cod_articulo === cod)
const bloquear = (si) => CFG.guardarConfig({ bloquear_sin_stock: si })
const cliente = { cod_cliente: '1', razon_social: 'Lor Sani SRL' }
const item = (cod, cantidad) => ({ cod_articulo: cod, denominacion: cod, cantidad, precio_venta: 100 })

before(() => {
  conexion.inicializarDB()
  P.crearPrecio({ cod_articulo: 'BARRA', denominacion: 'Queso barra', unidad_medida: 'kg', peso_promedio_kg: 4.5, precio_neto: 4000, stock: 100 })
  P.crearPrecio({ cod_articulo: 'MANT', denominacion: 'Manteca', unidad_medida: 'unid', precio_neto: 850 })
})

test('producto sin stock inicial queda en 0', () => {
  assert.equal(stockDe('MANT'), 0)
})

test('no permite código repetido al crear', () => {
  assert.equal(P.crearPrecio({ cod_articulo: 'MANT', denominacion: 'Otra', precio_neto: 1 }).ok, false)
})

test('venta descuenta stock y registra el movimiento', () => {
  const r = C.emitirComprobante({ cliente, items: [item('BARRA', 46.3)], totales: { total: 1 } })
  assert.equal(r.ok, true)
  assert.equal(stockDe('BARRA'), 53.7)
  const [mov] = S.listarMovimientos('BARRA')
  assert.equal(mov.tipo, 'venta')
  assert.equal(mov.cantidad, -46.3)
  assert.equal(mov.referencia, r.numero)
})

test('por defecto no bloquea: se puede vender sin stock', () => {
  assert.equal(CFG.leerConfig().bloquear_sin_stock, false)
})

test('con el bloqueo activado, sin stock suficiente no guarda nada', () => {
  bloquear(true)
  const antes = C.listarComprobantes().length
  const r = C.emitirComprobante({ cliente, items: [item('BARRA', 10), item('MANT', 1)], totales: { total: 1 } })
  assert.equal(r.ok, false)
  assert.equal(r.error, 'STOCK_INSUFICIENTE')
  assert.deepEqual(r.faltantes.map((f) => f.cod_articulo), ['MANT'])
  assert.equal(C.listarComprobantes().length, antes)
  assert.equal(stockDe('BARRA'), 53.7) // no descontó la barra
  bloquear(false)
})

test('ingreso de mercadería suma', () => {
  assert.equal(S.ingresarStock('MANT', 24, 'Compra').stock, 24)
})

test('ajuste por conteo registra la diferencia', () => {
  const r = S.ajustarStock('MANT', 20, 'Conteo')
  assert.equal(r.stock, 20)
  assert.equal(S.listarMovimientos('MANT')[0].cantidad, -4)
})

test('anular un pedido devuelve el stock, una sola vez', () => {
  const r = C.emitirComprobante({ cliente, items: [item('MANT', 5)], totales: { total: 1 } })
  assert.equal(stockDe('MANT'), 15)
  const id = C.listarComprobantes().find((c) => c.numero === r.numero).id
  assert.equal(C.anularComprobante(id).ok, true)
  assert.equal(stockDe('MANT'), 20)
  assert.equal(C.anularComprobante(id).ok, false)
  assert.equal(stockDe('MANT'), 20)
  assert.equal(C.listarComprobantes().find((c) => c.id === id).anulado, true)
})

test('editar el producto o reimportar el Excel no pisa el stock', () => {
  const id = P.listarPrecios().find((p) => p.cod_articulo === 'MANT').id
  P.actualizarPrecio(id, { cod_articulo: 'MANT', denominacion: 'Manteca 200 g', unidad_medida: 'unid', precio_neto: 900, stock: 999 })
  assert.equal(stockDe('MANT'), 20)
  const r = P.importarPrecios([
    { 'Código': 'MANT', 'Denominación': 'Manteca 200 g', 'Costo': 950, 'Stock': 999 },
    { 'Código': 'NUEVO', 'Denominación': 'Yogur', 'Costo': '320', 'Stock': '48' },
  ])
  assert.equal(r.importados, 2); assert.equal(r.nuevos, 1); assert.deepEqual(r.sinCosto, [])
  assert.equal(stockDe('MANT'), 20)
  assert.equal(stockDe('NUEVO'), 48)
})

test('no guarda un pedido con precio 0', () => {
  const r = C.emitirComprobante({ cliente, items: [{ ...item('MANT', 1), precio_venta: 0 }], totales: { total: 0 } })
  assert.equal(r.ok, false)
  assert.match(r.error, /sin precio/)
})

test('sin bloqueo vende igual y el stock queda negativo', () => {
  P.crearPrecio({ cod_articulo: 'YOG', denominacion: 'Yogur', unidad_medida: 'unid', precio_neto: 300 })
  const r = C.emitirComprobante({ cliente, items: [item('YOG', 6)], totales: { total: 1 } })
  assert.equal(r.ok, true)
  assert.equal(stockDe('YOG'), -6)
  assert.equal(S.listarMovimientos('YOG')[0].stock_resultante, -6)
})

test('precarga: reserva sin tocar el stock físico', () => {
  S.ingresarStock('BARRA', 46.3) // vuelve a 100
  const r = PC.guardarPrecarga({ cliente, items: [item('BARRA', 30)], total: 3000, margen: 15 })
  assert.equal(r.ok, true)
  assert.equal(stockDe('BARRA'), 100)
  assert.equal(productoDe('BARRA').reservado, 30)
  assert.equal(PC.listarPrecargas().length, 1)
})

test('precarga: con bloqueo, otro pedido no puede usar lo reservado', () => {
  bloquear(true)
  const r = C.emitirComprobante({ cliente, items: [item('BARRA', 80)], totales: { total: 1 } })
  assert.equal(r.error, 'STOCK_INSUFICIENTE')
  assert.equal(r.faltantes[0].disponible, 70)
  const r2 = PC.guardarPrecarga({ cliente, items: [item('BARRA', 71)] })
  assert.equal(r2.error, 'STOCK_INSUFICIENTE')
  bloquear(false)
})

test('precarga: editarla rehace la reserva', () => {
  const { id } = PC.listarPrecargas()[0]
  const r = PC.guardarPrecarga({ id, cliente, items: [item('BARRA', 46.3), item('MANT', 2)] })
  assert.equal(r.ok, true)
  assert.equal(r.id, id)
  assert.equal(productoDe('BARRA').reservado, 46.3)
  assert.equal(productoDe('MANT').reservado, 2)
  const p = PC.obtenerPrecarga(id)
  // su propia reserva cuenta como disponible
  assert.equal(p.items.find((i) => i.cod_articulo === 'BARRA').stock, 100)
  assert.equal(p.reservas.BARRA, 46.3)
})

test('precarga: al confirmarla descuenta el stock y libera la reserva', () => {
  bloquear(true)
  const { id } = PC.listarPrecargas()[0]
  const r = C.emitirComprobante({ cliente, items: [item('BARRA', 100)], totales: { total: 1 }, precarga_id: id })
  assert.equal(r.ok, true) // su reserva no le juega en contra
  assert.equal(stockDe('BARRA'), 0)
  assert.equal(productoDe('BARRA').reservado, 0)
  assert.equal(productoDe('MANT').reservado, 0)
  assert.equal(PC.listarPrecargas().length, 0)
  bloquear(false)
})

test('precarga: descartarla libera la reserva', () => {
  const { id } = PC.guardarPrecarga({ cliente, items: [item('MANT', 3)] })
  assert.equal(productoDe('MANT').reservado, 3)
  PC.descartarPrecarga(id)
  assert.equal(productoDe('MANT').reservado, 0)
  assert.equal(PC.obtenerPrecarga(id), null)
})

test('aumento por marca: solo esa marca y queda registrado', () => {
  P.crearPrecio({ cod_articulo: 'LQ1', denominacion: 'Cremoso', marca: 'La Quesera', precio_neto: 1000 })
  P.crearPrecio({ cod_articulo: 'LQ2', denominacion: 'Barra', marca: 'la quesera ', precio_neto: 2000 })
  P.crearPrecio({ cod_articulo: 'OTRA', denominacion: 'Otra', marca: 'Otra', precio_neto: 1000 })
  const r = P.aumentarCostos({ criterio: 'marca', valor: 'La Quesera', porcentaje: 15 })
  assert.deepEqual(r, { ok: true, productos: 2 })
  assert.equal(productoDe('LQ1').precio_neto, 1150)
  assert.equal(productoDe('LQ2').precio_neto, 2300)
  assert.equal(productoDe('OTRA').precio_neto, 1000)
  assert.equal(P.listarAumentos()[0].porcentaje, 15)
})

test('aumento: valida porcentaje y que existan productos', () => {
  assert.equal(P.aumentarCostos({ criterio: 'marca', valor: 'La Quesera', porcentaje: 0 }).ok, false)
  assert.equal(P.aumentarCostos({ criterio: 'marca', valor: 'No existe', porcentaje: 10 }).ok, false)
  assert.equal(P.aumentarCostos({ criterio: 'marca', valor: 'La Quesera', porcentaje: -100 }).ok, false)
  assert.equal(P.aumentarCostos({ criterio: 'marca', valor: 'Otra', porcentaje: '-10' }).ok, true)
  assert.equal(productoDe('OTRA').precio_neto, 900)
})

test('búsqueda sin acentos y por palabras sueltas', () => {
  P.crearPrecio({ cod_articulo: 'JC', denominacion: 'Jamón Cocido Paladini', marca: 'Paladini', precio_neto: 100 })
  assert.deepEqual(P.buscarProductos('jamon coc').map((p) => p.cod_articulo), ['JC'])
  assert.deepEqual(P.buscarProductos('paladini JAMÓN').map((p) => p.cod_articulo), ['JC'])
  const CL = require('../electron/db/clientes')
  CL.crearCliente({ cod_cliente: '77', razon_social: 'Restaurante El Rincón', domicilio: 'Colón 234' })
  assert.deepEqual(CL.buscarClientes('rincon').map((c) => c.cod_cliente), ['77'])
  assert.deepEqual(CL.buscarClientes('colon').map((c) => c.cod_cliente), ['77'])
})

test('piezas: el stock baja por piezas aunque se cobre por kg', () => {
  P.crearPrecio({ cod_articulo: 'HORMA', denominacion: 'Horma', unidad_medida: 'kg', peso_promedio_kg: 4.5, precio_neto: 1000, stock: 20 })
  const venta = { cod_articulo: 'HORMA', denominacion: 'Horma', tipo: 'piezas', unidades: 10, peso_kg: 46.3, cantidad: 46.3, cantidad_stock: 10, precio_venta: 1000 }
  const r = C.emitirComprobante({ cliente, items: [venta], totales: { total: 46300 } })
  assert.equal(r.ok, true)
  assert.equal(stockDe('HORMA'), 10)
  // ítem sin cantidad_stock (pedido viejo o precarga vieja): se deduce del tipo
  const r2 = C.emitirComprobante({ cliente, items: [{ ...venta, cantidad_stock: undefined, unidades: 2 }], totales: { total: 1 } })
  assert.equal(r2.ok, true)
  assert.equal(stockDe('HORMA'), 8)
  // anular devuelve exactamente lo que se descontó
  const id = C.listarComprobantes().find((c) => c.numero === r.numero).id
  C.anularComprobante(id)
  assert.equal(stockDe('HORMA'), 18)
})

test('precarga de piezas reserva piezas', () => {
  const venta = { cod_articulo: 'HORMA', tipo: 'piezas', unidades: 3, peso_kg: 13.5, cantidad: 13.5, cantidad_stock: 3, precio_venta: 1 }
  const { id } = PC.guardarPrecarga({ cliente, items: [venta] })
  assert.equal(productoDe('HORMA').reservado, 3)
  PC.descartarPrecarga(id)
})

test('agregar o sacar el peso promedio convierte el stock', () => {
  P.crearPrecio({ cod_articulo: 'FRAC', denominacion: 'Fraccionado', unidad_medida: 'kg', precio_neto: 1000, stock: 9.2 })
  const id = productoDe('FRAC').id
  P.actualizarPrecio(id, { cod_articulo: 'FRAC', denominacion: 'Fraccionado', unidad_medida: 'kg', peso_promedio_kg: 4.5, precio_neto: 1000 })
  assert.equal(stockDe('FRAC'), 2) // 9,2 kg / 4,5 ≈ 2 piezas
  P.actualizarPrecio(id, { cod_articulo: 'FRAC', denominacion: 'Fraccionado', unidad_medida: 'kg', peso_promedio_kg: '', precio_neto: 1000 })
  assert.equal(stockDe('FRAC'), 9) // 2 × 4,5
  // editar sin cambiar la forma de contar no toca el stock
  P.actualizarPrecio(id, { cod_articulo: 'FRAC', denominacion: 'Fracc.', unidad_medida: 'kg', precio_neto: 1200 })
  assert.equal(stockDe('FRAC'), 9)
})

test('migración: el stock en kg de las piezas pasa a piezas una sola vez', () => {
  const db = conexion.getDB()
  db.run(`INSERT INTO precios (cod_articulo, denominacion, unidad_medida, peso_promedio_kg, precio_neto, precio_con_iva, stock)
          VALUES ('VIEJA', 'Barra vieja', 'kg', 4.5, 1, 1, 120)`)
  db.run(`INSERT INTO precios (cod_articulo, denominacion, unidad_medida, precio_neto, precio_con_iva, stock)
          VALUES ('SUELTO', 'Suelto viejo', 'kg', 1, 1, 12.5)`)
  db.run(`DELETE FROM config WHERE clave = 'stock_en_piezas'`)
  conexion.migrarStockAPiezas(db)
  assert.equal(stockDe('VIEJA'), 27)   // 120 kg / 4,5
  assert.equal(stockDe('SUELTO'), 12.5) // el fraccionado sigue en kg
  conexion.migrarStockAPiezas(db)
  assert.equal(stockDe('VIEJA'), 27)   // no se aplica dos veces
})
