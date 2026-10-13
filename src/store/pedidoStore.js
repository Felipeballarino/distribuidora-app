import { create } from 'zustand'
import {
  crearItem, actualizarItem as actualizarItemPuro, totalPedido, itemValido, superaStock, puedeAgregarse, tienePrecio,
} from '../lib/pedido'

const PASOS = ['cliente', 'productos', 'resumen', 'emitido']

const usePedidoStore = create((set, get) => ({
  // Navegación
  paso: 'cliente',
  direccion: 1,

  // Datos del pedido
  cliente: null,
  items: [],
  // Margen que se aplica a todo el pedido (ej: 15 = +15% sobre el costo).
  // Se puede cambiar por producto; al cambiar el del pedido, se pisa en todos.
  margenPedido: 0,
  comprobanteEmitido: null,

  irA: (nuevoPaso) => {
    const actual = PASOS.indexOf(get().paso)
    const destino = PASOS.indexOf(nuevoPaso)
    set({ paso: nuevoPaso, direccion: destino > actual ? 1 : -1 })
  },

  seleccionarCliente: (cliente) => {
    set({ cliente })
    get().irA('productos')
  },

  setMargenPedido: (pct) => {
    const margen = Number(pct) || 0
    set({
      margenPedido: margen,
      items: get().items.map((i) => actualizarItemPuro(i, { markup_pct: margen })),
    })
  },

  // Agrega el producto o reemplaza la línea si ya estaba en el pedido.
  agregarItem: (producto, carga) => {
    const nuevo = crearItem(producto, carga)
    if (!puedeAgregarse(nuevo)) return false
    const { items } = get()
    const idx = items.findIndex((i) => i.cod_articulo === nuevo.cod_articulo)
    if (idx >= 0) {
      const copia = [...items]
      copia[idx] = nuevo
      set({ items: copia })
    } else {
      set({ items: [...items, nuevo] })
    }
    return true
  },

  // cambios: { unidades } | { peso_kg } | { markup_pct }
  actualizarItem: (cod_articulo, cambios) => {
    set({
      items: get().items.map((i) =>
        i.cod_articulo === cod_articulo ? actualizarItemPuro(i, cambios) : i
      ),
    })
  },

  eliminarItem: (cod_articulo) => {
    set({ items: get().items.filter((i) => i.cod_articulo !== cod_articulo) })
  },

  // Ítems que quedaron en 0 (no se puede emitir con ellos)
  hayItemsInvalidos: () => get().items.some((i) => !itemValido(i)),

  // Bloquea la emisión: algún producto quedó con precio 0
  hayItemsSinPrecio: () => get().items.some((i) => !tienePrecio(i)),

  // Bloquea la emisión: algún producto pide más de lo que hay
  hayItemsSinStock: () => get().items.some(superaStock),

  // El servidor informó stock real menor (otro pedido lo consumió): actualizar
  actualizarStockDisponible: (faltantes) => {
    const porCod = new Map(faltantes.map((f) => [f.cod_articulo, f.disponible]))
    set({
      items: get().items.map((i) => (porCod.has(i.cod_articulo) ? { ...i, stock: porCod.get(i.cod_articulo) } : i)),
    })
  },

  getTotal: () => totalPedido(get().items),

  setComprobanteEmitido: (comprobante) => {
    set({ comprobanteEmitido: comprobante })
    get().irA('emitido')
  },

  nuevoPedido: () => {
    set({
      paso: 'cliente',
      direccion: 1,
      cliente: null,
      items: [],
      margenPedido: 0,
      comprobanteEmitido: null,
    })
  },
}))

export default usePedidoStore
