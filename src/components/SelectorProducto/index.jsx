import { useState } from 'react'
import { Search, Plus, Minus, ShoppingCart, ArrowRight, User, X, Percent } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProductos } from '../../hooks/useProductos'
import usePedidoStore from '../../store/pedidoStore'
import { formatearPrecio } from '../../lib/utils'

const CATEGORIAS = ['Todos', 'Quesos', 'Manteca', 'Yogures', 'Fiambres', 'Cremas']
const MARKUPS_RAPIDOS = [0, 10, 15, 20, 25, 30]

export default function SelectorProducto() {
  const { productos, cargando, categoriaActiva, buscar, cargarPorCategoria } = useProductos()
  const { cliente, items, agregarItem, irA, nuevoPedido } = usePedidoStore((s) => ({
    cliente: s.cliente,
    items: s.items,
    agregarItem: s.agregarItem,
    irA: s.irA,
    nuevoPedido: s.nuevoPedido,
  }))

  const [unidades, setUnidades] = useState({})
  const [pesos, setPesos] = useState({})
  const [pesosRaw, setPesosRaw] = useState({})
  const [markups, setMarkups] = useState({})
  const [agregados, setAgregados] = useState({})
  // null = sin preset seleccionado (valores mixtos o todos en 0 por defecto)
  const [markupGlobal, setMarkupGlobal] = useState(null)

  const aplicarMarkupGlobal = (pct) => {
    setMarkupGlobal(pct)
    if (pct === null) return
    const nuevosMaps = {}
    productos.forEach((p) => { nuevosMaps[p.cod_articulo] = pct })
    setMarkups((prev) => ({ ...prev, ...nuevosMaps }))
  }

  const getUnidades = (cod) => unidades[cod] ?? 1
  const getPeso = (cod) => pesos[cod] ?? 1.0
  const getMarkup = (cod) => markups[cod] ?? 0

  const calcularPrecioVenta = (producto, markupPct) => {
    return producto.precio_neto * (1 + markupPct / 100)
  }

  const cambiarUnidades = (cod, delta, stockMax) => {
    setUnidades((prev) => {
      const nuevo = (prev[cod] ?? 1) + delta
      const max = stockMax != null ? stockMax : Infinity
      return { ...prev, [cod]: Math.max(1, Math.min(nuevo, max)) }
    })
  }

  const cambiarPeso = (cod, delta, stockMax) => {
    setPesos((prev) => {
      const nuevo = (prev[cod] ?? 1) + delta
      const max = stockMax != null ? stockMax : Infinity
      return { ...prev, [cod]: Math.max(1, Math.min(nuevo, max)) }
    })
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

        {/* Recargo global */}
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold text-texto-suave flex items-center gap-1">
            <Percent className="w-4 h-4" /> Recargo global:
          </span>
          {MARKUPS_RAPIDOS.map((pct) => {
            const activo = markupGlobal === pct
            return (
              <label
                key={pct}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 cursor-pointer select-none
                  font-semibold text-sm transition-colors
                  ${activo
                    ? 'border-primario bg-primario text-white'
                    : 'border-gray-200 bg-white text-texto-suave hover:border-primario hover:text-primario'}`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={activo}
                  onChange={() => aplicarMarkupGlobal(activo ? null : pct)}
                />
                {pct === 0 ? 'Sin recargo' : `${pct}%`}
              </label>
            )
          })}
          {markupGlobal !== null && (
            <span className="text-xs text-texto-suave italic">
              Aplicado a todos · podés editar cada uno abajo
            </span>
          )}
        </div>

        {/* Búsqueda y filtros */}
        <div className="mt-3 flex gap-3 flex-wrap">
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
                // sin dato de stock cargado se trata como sin stock (0), no como ilimitado
                const stockMax = producto.stock ?? 0
                const unidadesActuales = getUnidades(cod)
                const sinStock = stockMax === 0
                const enLimite = unidadesActuales >= stockMax

                return (
                  <motion.div
                    key={cod}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col"
                  >
                    {/* Encabezado: nombre + unidad + stock */}
                    <div className="px-3 pt-3 pb-2">
                      <div className="flex items-start gap-1 mb-1">
                        <p className="flex-1 text-sm font-bold text-texto leading-tight line-clamp-2 min-h-[2.5rem]">
                          {producto.denominacion}
                        </p>
                        <span className={`shrink-0 text-xs font-bold px-1.5 py-0.5 rounded-lg mt-0.5
                          ${esKg ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {producto.unidad_medida}
                        </span>
                      </div>
                      {stockMax != null && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block
                          ${sinStock ? 'bg-red-100 text-peligro' : stockMax <= 5 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          Stock: {stockMax}
                        </span>
                      )}
                    </div>

                    {/* Precio base + recargo + precio venta */}
                    <div className="mx-3 mb-2 bg-gray-50 rounded-xl px-2.5 py-2 flex items-center gap-1.5">
                      <span className="text-xs text-texto-suave font-mono">{formatearPrecio(producto.precio_neto)}</span>
                      <Percent className="w-3 h-3 text-texto-suave shrink-0 ml-auto" />
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={markup === 0 ? '' : markup}
                        placeholder="0"
                        onChange={(e) => {
                          const val = parseFloat(e.target.value)
                          setMarkupGlobal(null)
                          setMarkups((prev) => ({ ...prev, [cod]: isNaN(val) || val < 0 ? 0 : val }))
                        }}
                        className="w-9 text-center text-xs font-bold font-mono bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primario rounded"
                      />
                      <span className="text-lg font-extrabold font-mono text-primario ml-1">
                        {formatearPrecio(precioVenta)}
                      </span>
                    </div>

                    {/* Controles: Unidades y Kg en dos columnas */}
                    <div className="grid grid-cols-2 gap-2 px-3 pb-2">
                      {/* Unidades */}
                      <div>
                        <p className="text-xs text-texto-suave mb-1 font-semibold">Unid.</p>
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => cambiarUnidades(cod, -1, stockMax)}
                            className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0"
                          >
                            <Minus className="w-3 h-3 text-texto" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={stockMax ?? undefined}
                            step="1"
                            value={unidadesActuales}
                            onChange={(e) => {
                              const val = parseInt(e.target.value)
                              const max = stockMax ?? Infinity
                              setUnidades((prev) => ({ ...prev, [cod]: isNaN(val) || val < 1 ? 1 : Math.min(val, max) }))
                            }}
                            className="flex-1 w-0 text-center text-sm font-bold font-mono border border-gray-200 rounded-lg py-0.5 focus:outline-none focus:border-primario"
                          />
                          <button
                            onClick={() => cambiarUnidades(cod, 1, stockMax)}
                            disabled={enLimite}
                            className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3 h-3 text-texto" />
                          </button>
                        </div>
                      </div>

                      {/* Kg */}
                      <div>
                        <p className="text-xs text-texto-suave mb-1 font-semibold">Kg</p>
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => cambiarPeso(cod, -1, stockMax)}
                            className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0"
                          >
                            <Minus className="w-3 h-3 text-texto" />
                          </button>
                          <input
                            type="number"
                            min="0.1"
                            max={stockMax ?? undefined}
                            step="0.1"
                            value={pesosRaw[cod] !== undefined ? pesosRaw[cod] : getPeso(cod)}
                            onChange={(e) => {
                              const raw = e.target.value
                              setPesosRaw((prev) => ({ ...prev, [cod]: raw }))
                              const val = parseFloat(raw)
                              const max = stockMax != null ? stockMax : Infinity
                              if (!isNaN(val) && val > 0) {
                                setPesos((prev) => ({ ...prev, [cod]: Math.min(val, max) }))
                              }
                            }}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value)
                              const max = stockMax != null ? stockMax : Infinity
                              const final = isNaN(val) || val <= 0 ? 1 : Math.min(val, max)
                              setPesos((prev) => ({ ...prev, [cod]: final }))
                              setPesosRaw((prev) => ({ ...prev, [cod]: undefined }))
                            }}
                            className="flex-1 w-0 text-center text-sm font-bold font-mono border border-gray-200 rounded-lg py-0.5 focus:outline-none focus:border-primario"
                          />
                          <button
                            onClick={() => cambiarPeso(cod, 1, stockMax)}
                            disabled={stockMax != null && getPeso(cod) >= stockMax}
                            className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3 h-3 text-texto" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Footer: subtotal + botón */}
                    <div className="flex items-center gap-2 px-3 pb-3">
                      <div className="flex-1">
                        <p className="text-xs text-texto-suave">Subtotal</p>
                        <p className="text-sm font-extrabold font-mono text-texto">
                          {formatearPrecio(precioVenta * (esKg ? getPeso(cod) : getUnidades(cod)))}
                        </p>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => manejarAgregar(producto)}
                        disabled={sinStock}
                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors shrink-0
                          ${sinStock
                            ? 'bg-gray-200 text-texto-suave cursor-not-allowed'
                            : agregados[cod]
                              ? 'bg-secundario text-white'
                              : 'bg-primario text-white hover:bg-blue-700'}`}
                      >
                        {sinStock ? 'Sin stock' : agregados[cod] ? '✓' : 'Agregar'}
                      </motion.button>
                    </div>
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
