import { create } from 'zustand'

const usePedidoStore = create((set, get) => ({
  // Navegación
  paso: 'cliente',
  direccion: 1,

  // Datos del pedido
  cliente: null,
  items: [],
  comprobanteEmitido: null,

  // Navegación entre pasos
  irA: (nuevoPaso) => {
    const PASOS = ['cliente', 'productos', 'resumen', 'emitido']
    const actual = PASOS.indexOf(get().paso)
    const destino = PASOS.indexOf(nuevoPaso)
    set({ paso: nuevoPaso, direccion: destino > actual ? 1 : -1 })
  },

  // Cliente
  seleccionarCliente: (cliente) => {
    set({ cliente })
    get().irA('productos')
  },

  // Items del pedido
  // unidades: cantidad de piezas (informativo para kg, definitivo para unid)
  // peso_kg: peso total (solo para productos en kg, es la base del precio)
  // markup_pct: porcentaje de recargo sobre el precio de costo (ej: 10 = +10%)
  agregarItem: (producto, { unidades, peso_kg, markup_pct }) => {
    const cantidad = producto.unidad_medida === 'kg' ? peso_kg : unidades
    const precio_venta_neto = producto.precio_neto * (1 + markup_pct / 100)
    const precio_venta_con_iva = precio_venta_neto * 1.21

    const nuevoItem = {
      cod_articulo: producto.cod_articulo,
      denominacion: producto.denominacion,
      unidad_medida: producto.unidad_medida,
      precio_neto: producto.precio_neto,
      precio_con_iva: producto.precio_con_iva,
      precio_venta_neto,
      precio_venta_con_iva,
      markup_pct,
      unidades,
      peso_kg,
      cantidad,
    }

    const { items } = get()
    const existente = items.findIndex((i) => i.cod_articulo === producto.cod_articulo)
    if (existente >= 0) {
      const nuevosItems = [...items]
      nuevosItems[existente] = nuevoItem
      set({ items: nuevosItems })
    } else {
      set({ items: [...items, nuevoItem] })
    }
  },

  actualizarCantidad: (cod_articulo, cantidad) => {
    if (cantidad <= 0) {
      get().eliminarItem(cod_articulo)
      return
    }
    set({
      items: get().items.map((i) =>
        i.cod_articulo === cod_articulo
          ? {
              ...i,
              cantidad,
              // si es kg, sincronizamos peso_kg con la cantidad editada en resumen
              peso_kg: i.unidad_medida === 'kg' ? cantidad : i.peso_kg,
            }
          : i
      ),
    })
  },

  eliminarItem: (cod_articulo) => {
    set({ items: get().items.filter((i) => i.cod_articulo !== cod_articulo) })
  },

  // Totales calculados sobre precio de venta (con markup aplicado)
  getTotales: () => {
    const { items } = get()
    const neto = items.reduce((acc, i) => acc + i.precio_venta_neto * i.cantidad, 0)
    const iva = items.reduce(
      (acc, i) => acc + (i.precio_venta_con_iva - i.precio_venta_neto) * i.cantidad,
      0
    )
    return { neto, iva, total: neto + iva }
  },

  // Emisión
  setComprobanteEmitido: (comprobante) => {
    set({ comprobanteEmitido: comprobante })
    get().irA('emitido')
  },

  // Reiniciar pedido
  nuevoPedido: () => {
    set({
      paso: 'cliente',
      direccion: 1,
      cliente: null,
      items: [],
      comprobanteEmitido: null,
    })
  },
}))

export default usePedidoStore
