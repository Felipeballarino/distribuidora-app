import { useRef } from 'react'
import { Search } from 'lucide-react'
import { useProductos } from '../../hooks/useProductos'
import usePedidoStore from '../../store/pedidoStore'
import { CATEGORIAS } from '../../lib/categorias'
import TarjetaProducto from './TarjetaProducto'
import ResumenPedido from '../ResumenPedido'

// Pantalla de carga: catálogo a la izquierda, pedido siempre visible a la derecha.
// Teclado: escribir → Enter (va al primer producto) → cantidad → Enter (agrega y vuelve a buscar).
export default function SelectorProducto() {
  const { productos, cargando, categoriaActiva, buscar, cargarPorCategoria } = useProductos()
  const items = usePedidoStore((s) => s.items)
  const margenPedido = usePedidoStore((s) => s.margenPedido)
  const reservasPropias = usePedidoStore((s) => s.reservasPropias)
  const bloquearSinStock = usePedidoStore((s) => s.bloquearSinStock)
  const agregarItem = usePedidoStore((s) => s.agregarItem)
  const buscadorRef = useRef(null)
  const listaRef = useRef(null)

  const camposCantidad = () => [...(listaRef.current?.querySelectorAll('[data-cantidad]:not(:disabled)') || [])]

  // Mover el foco entre el buscador y las cantidades de cada producto
  const navegar = (desde, paso) => {
    if (desde === 'buscar') {
      buscadorRef.current?.focus()
      buscadorRef.current?.select()
      return
    }
    const campos = camposCantidad()
    const i = campos.indexOf(desde)
    if (i + paso < 0) return navegar('buscar')
    campos[i + paso]?.focus()
  }

  const enBuscador = (e) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault()
      camposCantidad()[0]?.focus()
    }
  }

  return (
    <div className="h-full flex">
      {/* Catálogo */}
      <section className="flex-1 min-w-0 flex flex-col">
        <div className="px-6 pt-5 pb-3 bg-fondo">
          <div className="relative">
            <Search className="absolute left-4 inset-y-0 my-auto w-5 h-5 text-texto-suave" />
            <input
              ref={buscadorRef}
              type="text"
              autoFocus
              placeholder="Buscar producto, marca o código…  (Enter para ir a la cantidad)"
              onChange={(e) => buscar(e.target.value)}
              onKeyDown={enBuscador}
              className="w-full pl-12 pr-4 h-12 text-lg bg-white border-2 border-borde rounded-xl
                         focus:outline-none focus:border-primario focus:ring-4 focus:ring-primario/10"
            />
          </div>
          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
            {['Todos', ...CATEGORIAS].map((cat) => (
              <button
                key={cat}
                onClick={() => cargarPorCategoria(cat)}
                className={`shrink-0 px-3.5 h-9 rounded-lg text-[15px] font-semibold transition-colors
                  ${categoriaActiva === cat ? 'bg-texto text-white' : 'bg-white border border-borde text-texto-suave hover:text-texto'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="flex items-center gap-3 pl-4 pr-3 pb-1.5 text-xs font-bold text-texto-suave uppercase tracking-wide">
            <span className="flex-1">Producto</span>
            <span className="w-[112px] xl:w-[124px] text-right pr-2">Precio</span>
            <span className="w-[112px] xl:w-[128px]">Cantidad</span>
            <span className="w-[88px] xl:w-[100px]" />
          </div>
          <div ref={listaRef} className="bg-white rounded-xl border border-borde shadow-tarjeta overflow-hidden">
            {cargando && productos.length === 0 && (
              <div className="flex justify-center py-12">
                <div className="w-7 h-7 border-[3px] border-primario border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!cargando && productos.length === 0 && (
              <p className="text-center text-texto-suave text-lg py-12">No se encontraron productos</p>
            )}
            {productos.map((producto) => {
              const cod = producto.cod_articulo
              const item = items.find((it) => it.cod_articulo === cod)
              return (
                <TarjetaProducto
                  // la key cambia cuando cambia el ítem del pedido, para que la fila muestre lo cargado
                  key={`${cod}-${item ? `${item.unidades}-${item.peso_kg}-${item.precio_manual}-${item.markup_pct}` : 'no'}`}
                  producto={producto}
                  margen={item ? item.markup_pct : margenPedido}
                  itemEnPedido={item}
                  reservaPropia={reservasPropias[cod]}
                  bloquearSinStock={bloquearSinStock}
                  onAgregar={(carga) => agregarItem(producto, carga)}
                  onNavegar={navegar}
                />
              )
            })}
          </div>
        </div>
      </section>

      {/* Pedido */}
      <ResumenPedido />
    </div>
  )
}
