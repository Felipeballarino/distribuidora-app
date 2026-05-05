import { useState } from 'react'
import { Search, Plus, Minus, ShoppingCart, ArrowRight, User, X, Percent } from 'lucide-react'
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

  // unidades: cantidad de piezas (para todos los productos)
  const [unidades, setUnidades] = useState({})
  // pesos: peso total en kg (solo para productos con unidad_medida = 'kg')
  const [pesos, setPesos] = useState({})
  // markups: porcentaje de recargo sobre el costo (0 = sin recargo)
  const [markups, setMarkups] = useState({})
  const [agregados, setAgregados] = useState({})

  const getUnidades = (cod) => unidades[cod] ?? 1
  const getPeso = (cod) => pesos[cod] ?? 1.0
  const getMarkup = (cod) => markups[cod] ?? 0

  const calcularPrecioVenta = (producto, markupPct) => {
    const neto = producto.precio_neto * (1 + markupPct / 100)
    return neto * 1.21
  }

  const cambiarUnidades = (cod, delta) => {
    setUnidades((prev) => ({ ...prev, [cod]: Math.max(1, (prev[cod] ?? 1) + delta) }))
  }

  const cambiarPeso = (cod, delta) => {
    setPesos((prev) => ({
      ...prev,
      [cod]: Math.max(0.1, parseFloat(((prev[cod] ?? 1.0) + delta).toFixed(1))),
    }))
  }

  const manejarAgregar = (producto) => {
    const cod = producto.cod_articulo
    agregarItem(producto, {
      unidades: getUnidades(cod),
      peso_kg: getPeso(cod),
      markup_pct: getMarkup(cod),
    })
    setAgregados((prev) => ({ ...prev, [cod]: true }))
    setTimeout(() => setAgregados((prev) => ({ ...prev, [cod]: false })), 1000)
  }

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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <AnimatePresence>
              {productos.map((producto, i) => {
                const cod = producto.cod_articulo
                const esKg = producto.unidad_medida === 'kg'
                const markup = getMarkup(cod)
                const precioVenta = calcularPrecioVenta(producto, markup)

                return (
                  <motion.div
                    key={cod}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex flex-col gap-2.5"
                  >
                    {/* Nombre */}
                    <p className="text-sm font-bold text-texto leading-tight line-clamp-2 min-h-[2.5rem]">
                      {producto.denominacion}
                    </p>

                    {/* Costo y precio de venta */}
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-texto-suave">
                        Costo: <span className="font-mono">{formatearPrecio(producto.precio_con_iva)}</span>
                      </span>
                      <span className="text-xs text-texto-suave">{producto.unidad_medida}</span>
                    </div>

                    {/* Campo % recargo */}
                    <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2 py-1.5">
                      <Percent className="w-3.5 h-3.5 text-texto-suave shrink-0" />
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={markup === 0 ? '' : markup}
                        placeholder="0"
                        onChange={(e) => {
                          const val = parseFloat(e.target.value)
                          setMarkups((prev) => ({
                            ...prev,
                            [cod]: isNaN(val) || val < 0 ? 0 : val,
                          }))
                        }}
                        className="w-12 text-center text-sm font-bold font-mono bg-transparent border-none
                                   focus:outline-none focus:ring-1 focus:ring-primario rounded"
                      />
                      <span className="text-xs text-texto-suave">recargo</span>
                      <span className="ml-auto text-sm font-extrabold font-mono text-primario">
                        {formatearPrecio(precioVenta)}
                      </span>
                    </div>

                    {/* Unidades */}
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-texto-suave w-14 shrink-0">Unidades</span>
                      <button
                        onClick={() => cambiarUnidades(cod, -1)}
                        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0"
                      >
                        <Minus className="w-3 h-3 text-texto" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={getUnidades(cod)}
                        onChange={(e) => {
                          const val = parseInt(e.target.value)
                          setUnidades((prev) => ({ ...prev, [cod]: isNaN(val) || val < 1 ? 1 : val }))
                        }}
                        className="flex-1 w-0 text-center text-sm font-bold font-mono border border-gray-200 rounded-lg py-0.5
                                   focus:outline-none focus:border-primario"
                      />
                      <button
                        onClick={() => cambiarUnidades(cod, 1)}
                        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0"
                      >
                        <Plus className="w-3 h-3 text-texto" />
                      </button>
                    </div>

                    {/* Peso total en kg (siempre visible) */}
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-texto-suave w-14 shrink-0">Peso kg</span>
                      <button
                        onClick={() => cambiarPeso(cod, -0.1)}
                        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0"
                      >
                        <Minus className="w-3 h-3 text-texto" />
                      </button>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={getPeso(cod)}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value)
                          setPesos((prev) => ({ ...prev, [cod]: isNaN(val) || val <= 0 ? 0.1 : val }))
                        }}
                        className="flex-1 w-0 text-center text-sm font-bold font-mono border border-gray-200 rounded-lg py-0.5
                                   focus:outline-none focus:border-primario"
                      />
                      <button
                        onClick={() => cambiarPeso(cod, 0.1)}
                        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0"
                      >
                        <Plus className="w-3 h-3 text-texto" />
                      </button>
                    </div>

                    {/* Subtotal preview */}
                    <div className="text-right text-xs text-texto-suave">
                      Subtotal:{' '}
                      <span className="font-mono font-bold text-texto">
                        {formatearPrecio(precioVenta * (esKg ? getPeso(cod) : getUnidades(cod)))}
                      </span>
                    </div>

                    {/* Botón agregar */}
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => manejarAgregar(producto)}
                      className={`w-full py-1.5 rounded-lg font-bold text-sm transition-colors
                        ${agregados[cod]
                          ? 'bg-secundario text-white'
                          : 'bg-primario text-white hover:bg-blue-700'}`}
                    >
                      {agregados[cod] ? '✓ Agregado' : 'Agregar'}
                    </motion.button>
                  </motion.div>
                )
              })}
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
