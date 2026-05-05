import { motion } from 'framer-motion'
import { CheckCircle, RotateCcw, Printer } from 'lucide-react'
import usePedidoStore from '../../store/pedidoStore'
import { formatearPrecio, formatearFecha } from '../../lib/utils'

export default function ComprobanteEmitido() {
  const { comprobanteEmitido, cliente, items, getTotales, nuevoPedido } = usePedidoStore((s) => ({
    comprobanteEmitido: s.comprobanteEmitido,
    cliente: s.cliente,
    items: s.items,
    getTotales: s.getTotales,
    nuevoPedido: s.nuevoPedido,
  }))

  const totales = getTotales()

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-fondo">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-xl p-8 text-center"
      >
        {/* Ícono de éxito */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
          className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6"
        >
          <CheckCircle className="w-14 h-14 text-secundario" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-extrabold text-texto mb-2"
        >
          ¡Pedido emitido!
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-fondo rounded-2xl p-5 mt-6 text-left space-y-3"
        >
          <div className="flex justify-between items-center">
            <span className="text-texto-suave">Comprobante N°</span>
            <span className="text-2xl font-extrabold font-mono text-primario">
              {comprobanteEmitido?.numero}
            </span>
          </div>
          <div className="flex justify-between items-center border-t border-gray-200 pt-3">
            <span className="text-texto-suave">Cliente</span>
            <span className="font-bold text-texto">{cliente?.razon_social}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-texto-suave">Ítems</span>
            <span className="font-bold text-texto">{items.length} productos</span>
          </div>
          <div className="flex justify-between items-center border-t border-gray-200 pt-3">
            <span className="text-texto-suave">Total</span>
            <span className="text-2xl font-extrabold font-mono text-texto">
              {formatearPrecio(totales.total)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-texto-suave">Fecha</span>
            <span className="text-sm text-texto-suave font-mono">
              {formatearFecha(new Date())}
            </span>
          </div>
        </motion.div>

        {/* Botones */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex gap-3 mt-8"
        >
          <button
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 py-4 border-2 border-gray-200
                       rounded-2xl text-lg font-bold text-texto hover:bg-gray-50 transition-colors"
          >
            <Printer className="w-5 h-5" />
            Imprimir
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={nuevoPedido}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-primario text-white
                       rounded-2xl text-lg font-bold hover:bg-blue-700 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            Nuevo pedido
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  )
}
