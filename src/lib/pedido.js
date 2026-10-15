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
//
// STOCK: se cuenta como se guarda en el galpón, no como se cobra.
//   'unidad' y 'piezas' → en unidades/piezas (una barra es 1, pese lo que pese)
//   'suelto'            → en kg (el fraccionado no tiene piezas)

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

// Unidad en que se cuenta el stock de un producto o ítem: 'kg' (solo suelto) | 'u'
export const unidadStock = (productoOItem) => {
  const tipo = productoOItem?.tipo ?? tipoCarga(productoOItem)
  return tipo === 'suelto' ? 'kg' : 'u'
}

// Cantidad que el ítem descuenta del stock: piezas/unidades, o kg si es suelto.
export const cantidadStock = (item) =>
  unidadStock(item) === 'kg' ? Number(item?.peso_kg) || 0 : Number(item?.unidades) || 0

// Cantidad sobre la que se calcula el precio: kg o unidades.
export const cantidadCobrada = (item) =>
  item?.unidad_medida === 'kg' ? Number(item.peso_kg) || 0 : Number(item?.unidades) || 0

// Precio de venta unitario del ítem. Acepta pedidos viejos que guardaban `precio_venta_neto`.
export const precioDeItem = (item) =>
  Number(item?.precio_venta ?? item?.precio_venta_neto ?? item?.precio_venta_con_iva) || 0

export const subtotalItem = (item) => redondear(precioDeItem(item) * cantidadCobrada(item))

export const totalPedido = (items = []) =>
  redondear(items.reduce((acc, i) => acc + subtotalItem(i), 0))

// Precio puesto a mano (pisa el margen). null/0/vacío = se usa el margen.
export const precioManualValido = (valor) => {
  const n = Number(valor)
  return n > 0 ? redondear(n) : null
}

// Disponible para vender = stock físico - reservado por precargas.
// `reservaPropia`: lo reservado por la precarga que se está editando (cuenta como disponible).
export const disponibleDe = (producto, reservaPropia = 0) =>
  redondear((Number(producto?.stock) || 0) - (Number(producto?.reservado) || 0) + (Number(reservaPropia) || 0), 3)

// Arma un ítem de pedido a partir del producto y lo que cargó el operador.
export function crearItem(producto, { unidades, peso_kg, kg_editado = false, markup_pct = 0, precio_manual = null }, reservaPropia = 0) {
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
    precio_manual: precioManualValido(precio_manual),
    precio_venta: precioVenta(costo, markup_pct),
    unidades: u,
    peso_kg: kg,
    kg_editado: tipo === 'piezas' && !!kg_editado,
    // disponible al momento de cargar (en la unidad en que se cobra)
    stock: disponibleDe(producto, reservaPropia),
  })
}

// Recalcula los campos derivados (cantidad cobrada y subtotal).
// El precio puesto a mano tiene prioridad sobre el margen.
export function normalizarItem(item) {
  const manual = precioManualValido(item.precio_manual)
  const conPrecio = {
    ...item,
    precio_manual: manual,
    precio_venta: manual ?? precioVenta(item.precio_costo, item.markup_pct),
  }
  const cantidad = cantidadCobrada(conPrecio)
  return {
    ...conPrecio,
    cantidad,
    // lo que se descuenta del stock (piezas/unidades, o kg si es suelto)
    cantidad_stock: cantidadStock(conPrecio),
    subtotal: redondear(conPrecio.precio_venta * cantidad),
  }
}

// Aplica cambios del operador a un ítem ya cargado.
//   { unidades }  → en 'piezas' recalcula kg, salvo que ya hayan cargado el peso real
//   { peso_kg }   → marca el peso como real (deja de recalcularse)
//   { markup_pct }
//   { precio_manual } → número para fijar el precio, null para volver al margen
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

// true si lo cargado supera lo disponible. Solo impide vender si está activado el bloqueo.
export const superaStock = (item) => cantidadStock(item) > stockDisponible(item) + 0.0005

// Precio > 0. Un producto con costo 0 se puede vender solo si le ponen el precio a mano.
export const tienePrecio = (item) => precioDeItem(item) > 0

// Se puede agregar al pedido: tiene precio y cantidad. Si el bloqueo de stock está activado, además tiene que alcanzar.
export const puedeAgregarse = (item, { bloquearSinStock = false } = {}) =>
  tienePrecio(item) && itemValido(item) && !(bloquearSinStock && superaStock(item))

// Texto del stock con su unidad ("12 pzas" / "24 u" / "5,3 kg")
export const textoStock = (productoOItem) => textoCantidadStock(stockDisponible(productoOItem), productoOItem)

// `productoOItem` define la unidad: kg (suelto), pzas (por kg en piezas) o u (por unidad)
export function textoCantidadStock(cantidad, productoOItem) {
  if (unidadStock(productoOItem) === 'kg') return formatearKg(cantidad)
  const n = (Number(cantidad) || 0).toLocaleString('es-AR', { maximumFractionDigits: 3 })
  const tipo = productoOItem?.tipo ?? tipoCarga(productoOItem)
  return tipo === 'piezas' ? `${n} ${Math.abs(Number(cantidad)) === 1 ? 'pza' : 'pzas'}` : `${n} u`
}

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
