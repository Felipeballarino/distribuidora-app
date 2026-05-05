import { useState } from 'react'
import { Search, Plus, Minus, ShoppingCart, ArrowRight, User, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProductos } from '../../hooks/useProductos'
import usePedidoStore from '../../store/pedidoStore'
import { formatearPrecio } from '../../lib/utils'

const CATEGORIAS = ['Todos', 'Quesos', 'Manteca', 'Yogures', 'Leche', 'Cremas']

export default function SelectorProducto() {
  const { productos, cargando, categoriaActiva, buscar, cargarPorCategoria } = useProductos()
  const { cliente, items, agregarItem, irA, nuevoPedido } = usePedidoStore((s) => ({
    cliente: s.cliente,
    items: s.items,
    agregarItem: s.agregarItem,
    irA: s.irA,
    nuevoPedido: s.nuevoPedido,
  }))

  const [cantidades, setCantidades] = useState({})
  const [inputValues, setInputValues] = useState({})
  const [agregados, setAgregados] = useState({})

  const getCantidad = (cod) => cantidades[cod] ?? 1
  const getInputValue = (cod) => inputValues[cod] ?? getCantidad(cod)

  const cambiarCantidad = (cod, delta, unidad) => {
    const paso = unidad === 'kg' ? 0.5 : 1
    setCantidades((prev) => ({
      ...prev,
      [cod]: Math.max(paso, (prev[cod] ?? 1) + delta * paso),
    }))
  }

  const manejarAgregar = (producto) => {
    const cantidad = getCantidad(producto.cod_articulo)
    agregarItem(producto, cantidad)
    setAgregados((prev) => ({ ...prev, [producto.cod_articulo]: true }))
    setTimeout(() => {
      setAgregados((prev) => ({ ...prev, [producto.cod_articulo]: false }))
    }, 1000)
  }

  const totalItems = items.reduce((acc, i) => acc + i.cantidad, 0)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-texto-suave">Pedido para</p>
            <p className="text-xl font-bold text-texto flex items-center gap-2">
              <User className="w-5 h-5 text-primario" />
              {cliente?.razon_social}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => nuevoPedido()}
              className="flex items-center gap-2 border-2 border-gray-200 text-texto-suave px-4 py-2.5 rounded-xl font-semibold
                         hover:border-peligro hover:text-peligro transition-colors"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
            <button
              onClick={() => irA('resumen')}
              disabled={items.length === 0}
              className="flex items-center gap-2 bg-primario text-white px-5 py-3 rounded-xl font-bold text-lg
                         disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {items.length > 0 ? `Ver pedido (${items.length})` : 'Ver pedido'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Búsqueda y filtros */}
        <div className="mt-4 flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 inset-y-0 my-auto w-5 h-5 text-texto-suave" />
            <input
              type="text"
              placeholder="Buscar producto..."
              onChange={(e) => buscar(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-lg border-2 border-gray-200 rounded-xl
                         focus:outline-none focus:border-primario transition-all"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIAS.map((cat) => (
              <button
                key={cat}
                onClick={() => cargarPorCategoria(cat)}
                className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors
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
            <div className="w-8 h-8 border-3 border-primario border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!cargando && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            <AnimatePresence>
              {productos.map((producto, i) => (
                <motion.div
                  key={producto.cod_articulo}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex flex-col gap-2"
                >
                  {/* Nombre y precio */}
                  <div>
                    <p className="text-sm font-bold text-texto leading-tight line-clamp-2">
                      {producto.denominacion}
                    </p>
                    <p className="text-base font-extrabold text-texto font-mono mt-1">
                      {formatearPrecio(producto.precio_con_iva)}
                    </p>
                    <p className="text-xs text-texto-suave">{producto.unidad_medida}</p>
                  </div>

                  {/* Control de cantidad */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => cambiarCantidad(producto.cod_articulo, -1, producto.unidad_medida)}
                      className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0"
                    >
                      <Minus className="w-3 h-3 text-texto" />
                    </button>
                    <input
                      type="number"
                      min={producto.unidad_medida === 'kg' ? '0.1' : '1'}
                      step={producto.unidad_medida === 'kg' ? '0.1' : '1'}
                      value={getInputValue(producto.cod_articulo)}
                      onChange={(e) => {
                        const raw = e.target.value
                        setInputValues((prev) => ({ ...prev, [producto.cod_articulo]: raw }))
                        const val = parseFloat(raw)
                        if (!isNaN(val) && val > 0) {
                          setCantidades((prev) => ({ ...prev, [producto.cod_articulo]: val }))
                        }
                      }}
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value)
                        const fallback = producto.unidad_medida === 'kg' ? 0.5 : 1
                        const final = (!isNaN(val) && val > 0) ? val : fallback
                        setCantidades((prev) => ({ ...prev, [producto.cod_articulo]: final }))
                        setInputValues((prev) => ({ ...prev, [producto.cod_articulo]: final }))
                      }}
                      className="flex-1 w-0 text-center text-sm font-bold font-mono border border-gray-200 rounded-lg py-0.5
                                 focus:outline-none focus:border-primario"
                    />
                    <button
                      onClick={() => cambiarCantidad(producto.cod_articulo, 1, producto.unidad_medida)}
                      className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0"
                    >
                      <Plus className="w-3 h-3 text-texto" />
                    </button>
                  </div>

                  {/* Botón agregar */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => manejarAgregar(producto)}
                    className={`w-full py-1.5 rounded-lg font-bold text-sm transition-colors
                      ${agregados[producto.cod_articulo]
                        ? 'bg-secundario text-white'
                        : 'bg-primario text-white hover:bg-blue-700'}`}
                  >
                    {agregados[producto.cod_articulo] ? '✓' : 'Agregar'}
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {!cargando && productos.length === 0 && (
          <p className="text-center text-texto-suave text-lg py-12">
            No hay productos en esta categoría
          </p>
        )}
      </div>
    </div>
  )
}
