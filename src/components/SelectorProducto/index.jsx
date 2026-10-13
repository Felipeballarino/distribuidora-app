import { useState, useEffect } from 'react'
import { Search, ShoppingCart, ArrowRight, User, X, Percent } from 'lucide-react'
import { useProductos } from '../../hooks/useProductos'
import usePedidoStore from '../../store/pedidoStore'
import { CATEGORIAS } from '../../lib/categorias'
import { formatearPrecio } from '../../lib/utils'
import TarjetaProducto from './TarjetaProducto'

const MARGENES_RAPIDOS = [0, 10, 15, 20, 25, 30]

export default function SelectorProducto() {
  const { productos, cargando, categoriaActiva, buscar, cargarPorCategoria } = useProductos()
  const cliente = usePedidoStore((s) => s.cliente)
  const items = usePedidoStore((s) => s.items)
  const margenPedido = usePedidoStore((s) => s.margenPedido)
  const setMargenPedido = usePedidoStore((s) => s.setMargenPedido)
  const agregarItem = usePedidoStore((s) => s.agregarItem)
  const irA = usePedidoStore((s) => s.irA)
  const nuevoPedido = usePedidoStore((s) => s.nuevoPedido)
  const total = usePedidoStore((s) => s.getTotal())

  // Margen distinto al del pedido para productos puntuales
  const [margenesPropios, setMargenesPropios] = useState({})
  const [confirmandoCancelar, setConfirmandoCancelar] = useState(false)

  // Al cambiar el margen del pedido se descartan los márgenes puntuales
  useEffect(() => { setMargenesPropios({}) }, [margenPedido])

  const margenDe = (cod) => {
    if (margenesPropios[cod] !== undefined) return margenesPropios[cod]
    const enPedido = items.find((i) => i.cod_articulo === cod)
    return enPedido ? enPedido.markup_pct : margenPedido
  }

  const cancelar = () => {
    if (items.length > 0 && !confirmandoCancelar) {
      setConfirmandoCancelar(true)
      setTimeout(() => setConfirmandoCancelar(false), 3000)
      return
    }
    nuevoPedido()
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-texto-suave">Pedido para</p>
            <p className="text-xl font-bold text-texto flex items-center gap-2 truncate">
              <User className="w-5 h-5 text-primario shrink-0" />
              {cliente?.razon_social}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={cancelar}
              className={`flex items-center gap-2 border-2 px-4 h-12 rounded-xl font-semibold transition-colors
                ${confirmandoCancelar
                  ? 'border-peligro bg-peligro text-white'
                  : 'border-gray-200 text-texto-suave hover:border-peligro hover:text-peligro'}`}
            >
              <X className="w-4 h-4" />
              {confirmandoCancelar ? '¿Borrar el pedido? Tocá de nuevo' : 'Cancelar'}
            </button>
            <button
              onClick={() => irA('resumen')}
              disabled={items.length === 0}
              className="flex items-center gap-2 bg-primario text-white px-5 h-12 rounded-xl font-bold text-lg
                         disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {items.length > 0 ? `Ver pedido (${items.length}) · ${formatearPrecio(total)}` : 'Ver pedido'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Margen del pedido */}
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <span className="text-base font-semibold text-texto-suave flex items-center gap-1 mr-1">
            <Percent className="w-4 h-4" /> Margen del pedido:
          </span>
          {MARGENES_RAPIDOS.map((pct) => (
            <button
              key={pct}
              onClick={() => setMargenPedido(pct)}
              className={`px-4 h-10 rounded-lg border-2 font-bold text-base transition-colors
                ${margenPedido === pct
                  ? 'border-primario bg-primario text-white'
                  : 'border-gray-200 bg-white text-texto-suave hover:border-primario hover:text-primario'}`}
            >
              {pct === 0 ? 'Sin margen' : `${pct}%`}
            </button>
          ))}
        </div>

        {/* Búsqueda y filtros */}
        <div className="mt-3 flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 inset-y-0 my-auto w-5 h-5 text-texto-suave" />
            <input
              type="text"
              autoFocus
              placeholder="Buscar producto o marca... (ej: cremoso, don bosco)"
              onChange={(e) => buscar(e.target.value)}
              className="w-full pl-10 pr-4 h-12 text-lg border-2 border-gray-200 rounded-xl
                         focus:outline-none focus:border-primario transition-all"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['Todos', ...CATEGORIAS].map((cat) => (
              <button
                key={cat}
                onClick={() => cargarPorCategoria(cat)}
                className={`px-4 h-12 rounded-xl font-semibold text-base transition-colors
                  ${categoriaActiva === cat
                    ? 'bg-primario text-white'
                    : 'bg-gray-100 text-texto-suave hover:bg-gray-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de productos */}
      <div className="flex-1 overflow-y-auto p-6">
        {cargando && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primario border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!cargando && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {productos.map((producto, i) => {
              const cod = producto.cod_articulo
              const itemEnPedido = items.find((it) => it.cod_articulo === cod)
              return (
                <TarjetaProducto
                  // la key cambia al agregar, para que la tarjeta tome los valores del pedido
                  key={`${cod}-${itemEnPedido ? 'en' : 'no'}`}
                  producto={producto}
                  indice={i}
                  margen={margenDe(cod)}
                  onCambiarMargen={(pct) => setMargenesPropios((prev) => ({ ...prev, [cod]: pct }))}
                  itemEnPedido={itemEnPedido}
                  onAgregar={(carga) => agregarItem(producto, carga)}
                />
              )
            })}
          </div>
        )}

        {!cargando && productos.length === 0 && (
          <p className="text-center text-texto-suave text-lg py-12">No se encontraron productos</p>
        )}
      </div>
    </div>
  )
}
