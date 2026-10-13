// Reglas de cálculo del pedido. Funciones puras (sin React) para poder testearlas.
//
// Cada producto se COBRA por unidad o por kg (`unidad_medida`: 'unid' | 'kg').
// Según eso y si tiene peso promedio, hay tres formas de cargarlo:
//   'unidad' → se cobra por unidad (manteca, yogur). Solo se cargan unidades.
//   'piezas' → se cobra por kg y viene en piezas (barra de queso, jamón).
//              Se cargan unidades y los kg se calculan: unidades × peso promedio.
//              Los kg se pueden corregir con el peso real (pesan antes de imprimir).
//   'suelto' → se cobra por kg, sin peso promedio (fraccionado). Solo se cargan kg.
// No se calcula IVA: el total es la suma de los subtotales.

export const redondear = (n, decimales = 2) => {
  const f = 10 ** decimales
  return Math.round((Number(n) || 0) * f) / f
}

export const esPorKg = (producto) => producto?.unidad_medida === 'kg'

export function tipoCarga(producto) {
  if (!esPorKg(producto)) return 'unidad'
  return Number(producto.peso_promedio_kg) > 0 ? 'piezas' : 'suelto'
}

// Costo del producto. En la base se guarda en `precio_neto`.
export const costoDe = (producto) => Number(producto?.precio_costo ?? producto?.precio_neto) || 0

export const precioVenta = (costo, margenPct) =>
  redondear((Number(costo) || 0) * (1 + (Number(margenPct) || 0) / 100))

export const kgEstimados = (unidades, pesoPromedio) =>
  redondear((Number(unidades) || 0) * (Number(pesoPromedio) || 0), 3)

// Convierte lo que escribe el usuario ("4,5", "4.5", "") a número. null si no es válido.
export function parsearNumero(texto) {
  if (texto === null || texto === undefined) return null
  if (typeof texto === 'number') return isNaN(texto) ? null : texto
  const t = String(texto).trim().replace(',', '.')
  if (t === '') return null
  const n = Number(t)
  return isNaN(n) ? null : n
}

// Cantidad sobre la que se calcula el precio: kg o unidades.
export const cantidadCobrada = (item) =>
  item?.unidad_medida === 'kg' ? Number(item.peso_kg) || 0 : Number(item?.unidades) || 0

// Precio de venta unitario del ítem. Acepta pedidos viejos que guardaban `precio_venta_neto`.
export const precioDeItem = (item) =>
  Number(item?.precio_venta ?? item?.precio_venta_neto ?? item?.precio_venta_con_iva) || 0

export const subtotalItem = (item) => redondear(precioDeItem(item) * cantidadCobrada(item))

export const totalPedido = (items = []) =>
  redondear(items.reduce((acc, i) => acc + subtotalItem(i), 0))

// Arma un ítem de pedido a partir del producto y lo que cargó el operador.
export function crearItem(producto, { unidades, peso_kg, kg_editado = false, markup_pct = 0 }) {
  const tipo = tipoCarga(producto)
  const costo = costoDe(producto)
  const u = tipo === 'suelto' ? Number(unidades) || 0 : Math.max(0, Math.round(Number(unidades) || 0))
  let kg = 0
  if (tipo === 'piezas') kg = kg_editado ? redondear(peso_kg, 3) : kgEstimados(u, producto.peso_promedio_kg)
  if (tipo === 'suelto') kg = redondear(peso_kg, 3)

  return normalizarItem({
    cod_articulo: producto.cod_articulo,
    denominacion: producto.denominacion,
    marca: producto.marca || '',
    unidad_medida: esPorKg(producto) ? 'kg' : 'unid',
    peso_promedio_kg: tipo === 'piezas' ? Number(producto.peso_promedio_kg) : null,
    tipo,
    precio_costo: costo,
    markup_pct: Number(markup_pct) || 0,
    precio_venta: precioVenta(costo, markup_pct),
    unidades: u,
    peso_kg: kg,
    kg_editado: tipo === 'piezas' && !!kg_editado,
    // stock disponible al momento de cargar (en la unidad en que se cobra)
    stock: Number(producto.stock) || 0,
  })
}

// Recalcula los campos derivados (cantidad cobrada y subtotal).
export function normalizarItem(item) {
  const conPrecio = { ...item, precio_venta: precioVenta(item.precio_costo, item.markup_pct) }
  const cantidad = cantidadCobrada(conPrecio)
  return { ...conPrecio, cantidad, subtotal: redondear(conPrecio.precio_venta * cantidad) }
}

// Aplica cambios del operador a un ítem ya cargado.
//   { unidades }  → en 'piezas' recalcula kg, salvo que ya hayan cargado el peso real
//   { peso_kg }   → marca el peso como real (deja de recalcularse)
//   { markup_pct }
export function actualizarItem(item, cambios) {
  const nuevo = { ...item, ...cambios }
  if ('unidades' in cambios) {
    nuevo.unidades = Math.max(0, Math.round(Number(cambios.unidades) || 0))
    if (item.tipo === 'piezas' && !item.kg_editado) {
      nuevo.peso_kg = kgEstimados(nuevo.unidades, item.peso_promedio_kg)
    }
  }
  if ('peso_kg' in cambios) {
    nuevo.peso_kg = Math.max(0, redondear(cambios.peso_kg, 3))
    if (item.tipo === 'piezas') nuevo.kg_editado = true
  }
  return normalizarItem(nuevo)
}

// Un ítem es válido si tiene algo para cobrar.
export const itemValido = (item) => cantidadCobrada(item) > 0

// Stock disponible del producto. Sin dato = 0 (no se puede vender).
export const stockDisponible = (productoOItem) => Number(productoOItem?.stock) || 0

// true si lo cargado supera el stock: NO se puede agregar ni confirmar.
export const superaStock = (item) => cantidadCobrada(item) > stockDisponible(item) + 0.0005

// Precio > 0. Un producto con costo 0 no se puede vender (el precio no se edita a mano).
export const tienePrecio = (item) => precioDeItem(item) > 0

// Se puede agregar al pedido: tiene precio, cantidad y hay stock.
export const puedeAgregarse = (item) => tienePrecio(item) && itemValido(item) && !superaStock(item)

// Texto del stock con su unidad ("53,7 kg" / "24 u")
export const textoStock = (productoOItem) =>
  productoOItem?.unidad_medida === 'kg'
    ? formatearKg(stockDisponible(productoOItem))
    : `${stockDisponible(productoOItem).toLocaleString('es-AR')} u`

const fmtKg = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 3 })
export const formatearKg = (kg) => `${fmtKg.format(Number(kg) || 0)} kg`

export const sufijoUnidad = (item) => (item?.unidad_medida === 'kg' ? '/kg' : '/u')

// Textos para boleta e historial. Sirven también para pedidos viejos (sin `tipo`).
export const textoCantidad = (item) =>
  item?.tipo !== 'suelto' && Number(item?.unidades) > 0 ? String(item.unidades) : '—'

export const textoKg = (item) =>
  item?.unidad_medida === 'kg' && Number(item?.peso_kg) > 0 ? formatearKg(item.peso_kg) : '—'

// Total guardado de un comprobante. Los pedidos viejos guardaban el total sin IVA en `total_neto`.
export const totalComprobante = (c) => Number(c?.total_neto ?? c?.total_final) || totalPedido(c?.items)
