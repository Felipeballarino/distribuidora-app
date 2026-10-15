import { create } from 'zustand'
import {
  crearItem, actualizarItem as actualizarItemPuro, totalPedido, itemValido, superaStock, puedeAgregarse, tienePrecio,
} from '../lib/pedido'

// 'productos' es la pantalla de carga: catálogo a la izquierda y pedido a la derecha
const PASOS = ['cliente', 'productos', 'emitido']

const ESTADO_PEDIDO_VACIO = {
  paso: 'cliente',
  direccion: 1,
  cliente: null,
  items: [],
  margenPedido: 0,
  comprobanteEmitido: null,
  // Precarga que se está terminando (null = pedido nuevo)
  precargaId: null,
  // Lo que esa precarga tiene reservado por producto: cuenta como disponible para ella
  reservasPropias: {},
}

const usePedidoStore = create((set, get) => ({
  ...ESTADO_PEDIDO_VACIO,

  // Configuración (se lee de la base al abrir la app)
  bloquearSinStock: false,
  // Mensaje para mostrar al volver a la pantalla de clientes (ej: "Precarga guardada")
  aviso: null,

  cargarConfig: async () => {
    try {
      const config = await window.api.config.leer()
      set({ bloquearSinStock: !!config?.bloquear_sin_stock })
    } catch (error) {
      console.error('No se pudo leer la configuración:', error)
    }
  },
  setBloquearSinStock: (valor) => set({ bloquearSinStock: !!valor }),

  irA: (nuevoPaso) => {
    const actual = PASOS.indexOf(get().paso)
    const destino = PASOS.indexOf(nuevoPaso)
    set({ paso: nuevoPaso, direccion: destino > actual ? 1 : -1 })
  },

  seleccionarCliente: (cliente) => {
    set({ cliente, aviso: null })
    get().irA('productos')
  },

  // Margen que se aplica a todo el pedido (ej: 15 = +15% sobre el costo).
  // Se puede cambiar por producto; al cambiar el del pedido, se pisa en todos.
  // Los precios puestos a mano se respetan.
  setMargenPedido: (pct) => {
    const margen = Number(pct) || 0
    set({
      margenPedido: margen,
      items: get().items.map((i) => actualizarItemPuro(i, { markup_pct: margen })),
    })
  },

  // Agrega el producto o reemplaza la línea si ya estaba en el pedido.
  agregarItem: (producto, carga) => {
    const { items, reservasPropias, bloquearSinStock } = get()
    const nuevo = crearItem(producto, carga, reservasPropias[producto.cod_articulo])
    if (!puedeAgregarse(nuevo, { bloquearSinStock })) return false
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

  // cambios: { unidades } | { peso_kg } | { markup_pct } | { precio_manual }
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

  // Algún producto pide más de lo disponible (aviso)
  hayItemsSobreStock: () => get().items.some(superaStock),

  // Bloquea la emisión solo si el bloqueo de stock está activado
  hayItemsSinStock: () => get().bloquearSinStock && get().items.some(superaStock),

  // El servidor informó stock real menor (otro pedido lo consumió): actualizar
  actualizarStockDisponible: (faltantes) => {
    const porCod = new Map(faltantes.map((f) => [f.cod_articulo, f.disponible]))
    set({
      items: get().items.map((i) => (porCod.has(i.cod_articulo) ? { ...i, stock: porCod.get(i.cod_articulo) } : i)),
    })
  },

  getTotal: () => totalPedido(get().items),

  // Retomar una precarga (a la mañana, para pesar y confirmar)
  cargarPrecarga: (precarga) => {
    set({
      ...ESTADO_PEDIDO_VACIO,
      cliente: {
        cod_cliente: precarga.cod_cliente,
        razon_social: precarga.razon_social,
        cuit: precarga.cuit,
        domicilio: precarga.domicilio,
      },
      items: precarga.items,
      margenPedido: Number(precarga.margen) || 0,
      precargaId: precarga.id,
      reservasPropias: precarga.reservas || {},
      aviso: null,
      paso: 'productos',
      direccion: 1,
    })
  },

  setComprobanteEmitido: (comprobante) => {
    set({ comprobanteEmitido: comprobante, precargaId: null, reservasPropias: {} })
    get().irA('emitido')
  },

  // Vuelve a la pantalla de clientes. `aviso` se muestra arriba (ej: precarga guardada).
  nuevoPedido: (aviso = null) => {
    set({ ...ESTADO_PEDIDO_VACIO, aviso })
  },

  cerrarAviso: () => set({ aviso: null }),
}))

export default usePedidoStore
