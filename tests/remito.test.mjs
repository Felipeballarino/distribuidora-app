import { test } from 'node:test'
import assert from 'node:assert/strict'
import { paginarItems, htmlBoleta, FILAS_POR_HOJA } from '../src/lib/imprimirRemito.js'

const item = (i) => ({ cod_articulo: String(i), denominacion: `Producto ${i}`, unidad_medida: 'unid', tipo: 'unidad', unidades: 1, cantidad: 1, precio_venta: 100 })
const comp = (n) => ({ numero: '00000007', razon_social: 'Cliente <SRL>', items: Array.from({ length: n }, (_, i) => item(i)), total_neto: n * 100 })

test('boleta: reparte los productos en hojas', () => {
  assert.equal(paginarItems([]).length, 1)
  assert.equal(paginarItems(comp(FILAS_POR_HOJA).items).length, 1)
  assert.equal(paginarItems(comp(FILAS_POR_HOJA + 1).items).length, 2)
  assert.equal(paginarItems(comp(FILAS_POR_HOJA * 2 + 1).items).length, 3)
})

test('boleta: cada hoja tiene original y duplicado; el total va en la última', () => {
  const html = htmlBoleta(comp(FILAS_POR_HOJA + 3), { nombre: 'Distri' })
  assert.equal(html.match(/class="pagina"/g).length, 2)
  assert.equal(html.match(/>ORIGINAL</g).length, 2)
  assert.equal(html.match(/>DUPLICADO</g).length, 2)
  assert.equal(html.match(/Hoja 2 de 2/g).length, 2)
  assert.equal(html.match(/Sigue en la hoja 2/g).length, 2)
  assert.equal(html.match(/>TOTAL</g).length, 2) // original y duplicado de la última hoja
  assert.ok(html.includes('Cliente &lt;SRL&gt;'))
})

test('boleta de una sola hoja no muestra "Hoja 1 de 1"', () => {
  assert.ok(!htmlBoleta(comp(3)).includes('Hoja 1'))
})
