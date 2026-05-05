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
  agregarItem: (producto, cantidad) => {
    const { items } = get()
    const existente = items.findIndex((i) => i.cod_articulo === producto.cod_articulo)

    if (existente >= 0) {
      const nuevosItems = [...items]
      nuevosItems[existente] = {
        ...nuevosItems[existente],
        cantidad: nuevosItems[existente].cantidad + cantidad,
      }
      set({ items: nuevosItems })
    } else {
      set({
        items: [
          ...items,
          {
            cod_articulo: producto.cod_articulo,
            denominacion: producto.denominacion,
            unidad_medida: producto.unidad_medida,
            precio_neto: producto.precio_neto,
            precio_con_iva: producto.precio_con_iva,
            categoria: producto.categoria,
            cantidad,
          },
        ],
      })
    }
  },

  actualizarCantidad: (cod_articulo, cantidad) => {
    if (cantidad <= 0) {
      get().eliminarItem(cod_articulo)
      return
    }
    set({
      items: get().items.map((i) =>
        i.cod_articulo === cod_articulo ? { ...i, cantidad } : i
      ),
    })
  },

  eliminarItem: (cod_articulo) => {
    set({ items: get().items.filter((i) => i.cod_articulo !== cod_articulo) })
  },

  // Totales calculados
  getTotales: () => {
    const { items } = get()
    const neto = items.reduce((acc, i) => acc + i.precio_neto * i.cantidad, 0)
    const iva = items.reduce(
      (acc, i) => acc + (i.precio_con_iva - i.precio_neto) * i.cantidad,
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
