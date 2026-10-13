import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  tipoCarga, precioVenta, crearItem, actualizarItem, totalPedido, parsearNumero,
  cantidadCobrada, superaStock, precioDeItem, subtotalItem, puedeAgregarse,
} from '../src/lib/pedido.js'

const barra = { cod_articulo: '2', denominacion: 'Queso barra', unidad_medida: 'kg', peso_promedio_kg: 4.5, precio_neto: 4000, stock: 50 }
const manteca = { cod_articulo: 'M1', denominacion: 'Manteca 200 g', unidad_medida: 'unid', precio_neto: 850, stock: null }
const mantecaConStock = { ...manteca, stock: 100 }
const fraccionado = { cod_articulo: 'Q9', denominacion: 'Cremoso fraccionado', unidad_medida: 'kg', peso_promedio_kg: null, precio_neto: 4200 }

test('tipo de carga según producto', () => {
  assert.equal(tipoCarga(manteca), 'unidad')
  assert.equal(tipoCarga(barra), 'piezas')
  assert.equal(tipoCarga(fraccionado), 'suelto')
})

test('precio de venta = costo + margen', () => {
  assert.equal(precioVenta(4000, 25), 5000)
  assert.equal(precioVenta(850, 0), 850)
  assert.equal(precioVenta(1000, 15), 1150)
})

test('piezas: kg = unidades × peso promedio, se cobra por kg', () => {
  const i = crearItem(barra, { unidades: 10, markup_pct: 25 })
  assert.equal(i.peso_kg, 45)
  assert.equal(i.cantidad, 45)
  assert.equal(i.subtotal, 225000)
})

test('piezas: el peso real pisa al estimado y no se recalcula al cambiar unidades', () => {
  let i = crearItem(barra, { unidades: 10, markup_pct: 25 })
  i = actualizarItem(i, { peso_kg: 46.3 })
  assert.equal(i.kg_editado, true)
  assert.equal(i.subtotal, 231500)
  i = actualizarItem(i, { unidades: 11 })
  assert.equal(i.peso_kg, 46.3)
})

test('piezas: sin peso real, cambiar unidades recalcula kg', () => {
  let i = crearItem(barra, { unidades: 10 })
  i = actualizarItem(i, { unidades: 4 })
  assert.equal(i.peso_kg, 18)
})

test('unidad: no tiene kg (sin el "1 kg" falso)', () => {
  const i = crearItem(mantecaConStock, { unidades: 12, peso_kg: 1 })
  assert.equal(i.peso_kg, 0)
  assert.equal(i.subtotal, 10200)
})

test('suelto: se cobra por kg cargado', () => {
  const i = crearItem(fraccionado, { peso_kg: 2.5, markup_pct: 10 })
  assert.equal(i.cantidad, 2.5)
  assert.equal(i.subtotal, 11550)
})

test('cambiar margen recalcula precio y subtotal', () => {
  let i = crearItem(barra, { unidades: 10, markup_pct: 0 })
  i = actualizarItem(i, { markup_pct: 10 })
  assert.equal(i.precio_venta, 4400)
  assert.equal(i.subtotal, 198000)
})

test('total del pedido sin IVA', () => {
  const items = [crearItem(barra, { unidades: 10, markup_pct: 25 }), crearItem(mantecaConStock, { unidades: 12 })]
  assert.equal(totalPedido(items), 235200)
})

test('stock: sin dato es 0 y no se puede agregar', () => {
  const i = crearItem(manteca, { unidades: 1 })
  assert.equal(i.stock, 0)
  assert.equal(puedeAgregarse(i), false)
})

test('stock: no se puede pedir más de lo que hay (en kg para productos por kg)', () => {
  assert.equal(puedeAgregarse(crearItem(barra, { unidades: 11 })), true)   // 49,5 kg de 50
  assert.equal(puedeAgregarse(crearItem(barra, { unidades: 12 })), false)  // 54 kg de 50
  assert.equal(superaStock(crearItem(barra, { unidades: 10, peso_kg: 50, kg_editado: true })), false)
})

test('parsea coma decimal', () => {
  assert.equal(parsearNumero('4,5'), 4.5)
  assert.equal(parsearNumero(''), null)
  assert.equal(parsearNumero('abc'), null)
})

test('compatible con pedidos viejos', () => {
  const viejo = { unidad_medida: 'unid', unidades: 3, cantidad: 3, precio_venta_neto: 100 }
  assert.equal(precioDeItem(viejo), 100)
  assert.equal(subtotalItem(viejo), 300)
  assert.equal(cantidadCobrada(viejo), 3)
})

test('precio 0: no se puede agregar', async () => {
  const { puedeAgregarse: puede } = await import('../src/lib/pedido.js')
  const gratis = { cod_articulo: 'X', denominacion: 'Sin costo', unidad_medida: 'unid', precio_neto: 0, stock: 10 }
  assert.equal(puede(crearItem(gratis, { unidades: 1, markup_pct: 25 })), false)
})
