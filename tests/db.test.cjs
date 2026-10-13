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

const stockDe = (cod) => P.listarPrecios().find((p) => p.cod_articulo === cod).stock
const cliente = { cod_cliente: '1', razon_social: 'Lor Sani SRL' }
const item = (cod, cantidad) => ({ cod_articulo: cod, denominacion: cod, cantidad })

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

test('sin stock suficiente no guarda nada', () => {
  const antes = C.listarComprobantes().length
  const r = C.emitirComprobante({ cliente, items: [item('BARRA', 10), item('MANT', 1)], totales: { total: 1 } })
  assert.equal(r.ok, false)
  assert.equal(r.error, 'STOCK_INSUFICIENTE')
  assert.deepEqual(r.faltantes.map((f) => f.cod_articulo), ['MANT'])
  assert.equal(C.listarComprobantes().length, antes)
  assert.equal(stockDe('BARRA'), 53.7) // no descontó la barra
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
