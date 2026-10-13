import { useState } from 'react'
import { Trash2, ArrowLeft, CheckCircle, User, MapPin, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import usePedidoStore from '../../store/pedidoStore'
import { formatearPrecio } from '../../lib/utils'

export default function ResumenPedido() {
  const { cliente, items, eliminarItem, actualizarCantidad, getTotales, irA, setComprobanteEmitido, hayItemsSinStock } =
    usePedidoStore((s) => ({
      cliente: s.cliente,
      items: s.items,
      eliminarItem: s.eliminarItem,
      actualizarCantidad: s.actualizarCantidad,
      getTotales: s.getTotales,
      irA: s.irA,
      setComprobanteEmitido: s.setComprobanteEmitido,
      hayItemsSinStock: s.hayItemsSinStock,
    }))

  const [emitiendo, setEmitiendo] = useState(false)
  const totales = getTotales()
  const sinStock = hayItemsSinStock()

  const emitir = async () => {
    if (emitiendo || items.length === 0 || sinStock) return
    setEmitiendo(true)
    try {
      const resultado = await window.api.comprobantes.emitir({ cliente, items, totales })
      setComprobanteEmitido(resultado)
    } catch (err) {
      console.error('Error al emitir:', err)
      alert('Error al emitir el comprobante. Intente nuevamente.')
    } finally {
      setEmitiendo(false)
    }
  }

  return (
    <div className="h-full flex flex-col max-w-3xl mx-auto w-full">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 flex-shrink-0">
        <button
          onClick={() => irA('productos')}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-texto" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-extrabold text-texto">Resumen del pedido</h2>
          <p className="flex items-center gap-1.5 text-sm text-texto-suave truncate">
            <User className="w-3.5 h-3.5 shrink-0" />
            {cliente?.razon_social}
            {cliente?.domicilio && (
              <>
                <MapPin className="w-3.5 h-3.5 ml-1 shrink-0" />
                {cliente.domicilio}
              </>
            )}
          </p>
        </div>
        <span className="shrink-0 text-sm font-bold text-texto-suave bg-gray-100 px-3 py-1 rounded-full">
          {items.length} {items.length === 1 ? 'producto' : 'productos'}
        </span>
      </div>

      {/* Tabla de items */}
      <div className="flex-1 overflow-y-auto p-4">
        {items.length === 0 ? (
          <div className="text-center text-texto-suave py-16 text-lg">
            No hay productos en el pedido
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Cabecera tabla */}
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-4 py-2.5 bg-fondo border-b border-gray-100">
              <span className="text-xs font-bold text-texto-suave uppercase tracking-wide">Producto</span>
              <span className="text-xs font-bold text-texto-suave uppercase tracking-wide text-center w-24">Unid. / Kg</span>
              <span className="text-xs font-bold text-texto-suave uppercase tracking-wide text-right w-28">Precio</span>
              <span className="text-xs font-bold text-texto-suave uppercase tracking-wide text-right w-28">Subtotal</span>
              <span className="w-8" />
            </div>

            {/* Filas */}
            <AnimatePresence initial={false}>
              {items.map((item, idx) => {
                const paso = item.unidad_medida === 'kg' ? 0.1 : 1
                const subtotal = item.precio_venta_neto * item.cantidad
                const itemSinStock = item.stock <= 0 || item.cantidad > item.stock
                return (
                  <motion.div
                    key={item.cod_articulo}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    className={`grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-4 py-3 items-center
                      border-b border-gray-50 ${itemSinStock ? 'bg-red-50' : idx % 2 === 1 ? 'bg-gray-50/40' : ''}`}
                  >
                    {/* Nombre */}
                    <div>
                      <p className="font-semibold text-texto text-sm leading-tight">{item.denominacion}</p>
                      {itemSinStock && (
                        <p className="flex items-center gap-1 text-xs font-bold text-peligro mt-0.5">
                          <AlertTriangle className="w-3 h-3" />
                          {item.stock <= 0 ? 'Sin stock' : `Solo hay ${item.stock} disponibles`}
                        </p>
                      )}
                    </div>

                    {/* Cantidad con controles */}
                    <div className="flex items-center gap-1 w-24 justify-center">
                      <button
                        onClick={() => actualizarCantidad(item.cod_articulo, parseFloat((item.cantidad - paso).toFixed(1)))}
                        className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-sm transition-colors"
                      >
                        −
                      </button>
                      <span className="w-14 text-center font-bold font-mono text-sm tabular-nums">
                        {item.unidad_medida === 'kg'
                          ? `${item.cantidad.toFixed(1)}kg`
                          : item.cantidad}
                      </span>
                      <button
                        onClick={() => actualizarCantidad(item.cod_articulo, parseFloat((item.cantidad + paso).toFixed(1)))}
                        className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-sm transition-colors"
                      >
                        +
                      </button>
                    </div>

                    {/* Precio unitario */}
                    <p className="text-right font-mono text-sm text-texto-suave w-28 tabular-nums">
                      {formatearPrecio(item.precio_venta_neto)}
                    </p>

                    {/* Subtotal */}
                    <p className="text-right font-extrabold font-mono text-sm text-texto w-28 tabular-nums">
                      {formatearPrecio(subtotal)}
                    </p>

                    {/* Eliminar */}
                    <button
                      onClick={() => eliminarItem(item.cod_articulo)}
                      className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-50 text-peligro transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer: total + emitir */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <span className="text-texto-suave font-semibold text-lg">Total del pedido</span>
          <span className="text-3xl font-extrabold font-mono text-texto tabular-nums">
            {formatearPrecio(totales.neto)}
          </span>
        </div>

        {sinStock && (
          <p className="flex items-center gap-2 text-sm font-bold text-peligro bg-red-50 rounded-xl px-4 py-2.5 mb-3">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Hay productos sin stock suficiente. Ajustá las cantidades o quitalos para poder emitir el comprobante.
          </p>
        )}

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={emitir}
          disabled={emitiendo || items.length === 0 || sinStock}
          className="w-full py-4 bg-secundario text-white rounded-2xl text-xl font-extrabold
                     flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed
                     hover:bg-green-700 transition-colors"
        >
          {emitiendo ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Emitiendo...
            </>
          ) : (
            <>
              <CheckCircle className="w-6 h-6" />
              Emitir comprobante
            </>
          )}
        </motion.button>
      </div>
    </div>
  )
}
