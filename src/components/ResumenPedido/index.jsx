import { useState } from 'react'
import { Trash2, ArrowLeft, CheckCircle, User, MapPin } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import usePedidoStore from '../../store/pedidoStore'
import { formatearPrecio, formatearCantidad } from '../../lib/utils'

export default function ResumenPedido() {
  const { cliente, items, eliminarItem, actualizarCantidad, getTotales, irA, setComprobanteEmitido } =
    usePedidoStore((s) => ({
      cliente: s.cliente,
      items: s.items,
      eliminarItem: s.eliminarItem,
      actualizarCantidad: s.actualizarCantidad,
      getTotales: s.getTotales,
      irA: s.irA,
      setComprobanteEmitido: s.setComprobanteEmitido,
    }))

  const [emitiendo, setEmitiendo] = useState(false)
  const totales = getTotales()

  const emitir = async () => {
    if (emitiendo || items.length === 0) return
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
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => irA('productos')}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-texto" />
        </button>
        <div>
          <h2 className="text-2xl font-extrabold text-texto">Resumen del pedido</h2>
          <p className="flex items-center gap-2 text-texto-suave">
            <User className="w-4 h-4" />
            {cliente?.razon_social}
            {cliente?.domicilio && (
              <>
                <MapPin className="w-4 h-4 ml-2" />
                {cliente.domicilio}
              </>
            )}
          </p>
        </div>
      </div>

      {/* Lista de items */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        <AnimatePresence>
          {items.map((item) => {
            const paso = item.unidad_medida === 'kg' ? 0.1 : 1
            return (
              <motion.div
                key={item.cod_articulo}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16, height: 0 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold text-texto">{item.denominacion}</p>

                  {/* Detalle: unidades, peso y precio de venta */}
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-sm text-texto-suave">
                    <span>{item.unidades} {item.unidades === 1 ? 'unidad' : 'unidades'}</span>
                    <span className="font-mono">{item.peso_kg?.toFixed(1)} kg</span>
                    <span>×</span>
                    <span className="font-mono">{formatearPrecio(item.precio_venta_con_iva)}</span>
                    {item.markup_pct > 0 && (
                      <span className="text-xs bg-blue-50 text-primario font-semibold px-1.5 py-0.5 rounded">
                        +{item.markup_pct}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Controles de cantidad inline */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => actualizarCantidad(item.cod_articulo, parseFloat((item.cantidad - paso).toFixed(1)))}
                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-lg font-bold"
                  >
                    −
                  </button>
                  <span className="w-14 text-center font-bold font-mono text-sm">
                    {item.unidad_medida === 'kg'
                      ? `${item.cantidad.toFixed(1)} kg`
                      : item.cantidad}
                  </span>
                  <button
                    onClick={() => actualizarCantidad(item.cod_articulo, parseFloat((item.cantidad + paso).toFixed(1)))}
                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-lg font-bold"
                  >
                    +
                  </button>
                </div>

                {/* Subtotal */}
                <p className="text-xl font-extrabold font-mono text-texto w-28 text-right">
                  {formatearPrecio(item.precio_venta_con_iva * item.cantidad)}
                </p>

                <button
                  onClick={() => eliminarItem(item.cod_articulo)}
                  className="p-2 rounded-xl hover:bg-red-50 text-peligro transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {items.length === 0 && (
          <div className="text-center text-texto-suave py-12 text-lg">
            No hay productos en el pedido
          </div>
        )}
      </div>

      {/* Totales y botón emitir */}
      <div className="bg-white border-t border-gray-200 px-6 py-5">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1 text-lg">
            <div className="flex justify-between gap-16 text-texto-suave">
              <span>Neto gravado</span>
              <span className="font-mono">{formatearPrecio(totales.neto)}</span>
            </div>
            <div className="flex justify-between gap-16 text-texto-suave">
              <span>IVA (21%)</span>
              <span className="font-mono">{formatearPrecio(totales.iva)}</span>
            </div>
            <div className="flex justify-between gap-16 text-2xl font-extrabold text-texto pt-2 border-t border-gray-200">
              <span>Total</span>
              <span className="font-mono">{formatearPrecio(totales.total)}</span>
            </div>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={emitir}
          disabled={emitiendo || items.length === 0}
          className="w-full py-4 bg-secundario text-white rounded-2xl text-2xl font-extrabold
                     flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed
                     hover:bg-green-700 transition-colors"
        >
          {emitiendo ? (
            <>
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Emitiendo...
            </>
          ) : (
            <>
              <CheckCircle className="w-7 h-7" />
              Emitir comprobante
            </>
          )}
        </motion.button>
      </div>
    </div>
  )
}
