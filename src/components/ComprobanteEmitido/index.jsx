import { motion } from 'framer-motion'
import { CheckCircle, RotateCcw, Printer } from 'lucide-react'
import usePedidoStore from '../../store/pedidoStore'
import { formatearPrecio, formatearFecha } from '../../lib/utils'
import DetalleItems from '../DetalleItems'
import { getEmpresa } from '../../lib/empresa'
import { imprimirRemito } from '../../lib/imprimirRemito'
import { useState } from 'react'

export default function ComprobanteEmitido() {
  const comprobanteEmitido = usePedidoStore((s) => s.comprobanteEmitido)
  const cliente = usePedidoStore((s) => s.cliente)
  const items = usePedidoStore((s) => s.items)
  const nuevoPedido = usePedidoStore((s) => s.nuevoPedido)
  const total = usePedidoStore((s) => s.getTotal())

  const [imprimiendo, setImprimiendo] = useState(false)

  const handleImprimir = () => {
    setImprimiendo(true)
    const empresa = getEmpresa()
    const comprobante = {
      numero: comprobanteEmitido.numero,
      fecha: new Date().toISOString(),
      razon_social: cliente.razon_social,
      cuit: cliente.cuit,
      domicilio: cliente.domicilio,
      cod_cliente: cliente.cod_cliente,
      items,
      total_neto: total,
    }
    imprimirRemito(comprobante, empresa)
    setTimeout(() => setImprimiendo(false), 1500)
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-start py-8 px-4 bg-fondo">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden"
      >
        {/* Encabezado de éxito */}
        <div className="bg-secundario/10 px-8 py-6 flex items-center gap-5 border-b border-green-100">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-sm flex-shrink-0"
          >
            <CheckCircle className="w-10 h-10 text-secundario" />
          </motion.div>
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-extrabold text-texto"
            >
              ¡Pedido guardado!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-texto-suave font-mono text-lg mt-0.5"
            >
              Pedido N° <span className="font-extrabold text-primario">{comprobanteEmitido?.numero}</span>
            </motion.p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-texto-suave">Fecha y hora</p>
            <p className="font-mono text-sm text-texto font-semibold">{formatearFecha(new Date())}</p>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Datos del cliente */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <h2 className="text-xs font-bold text-texto-suave uppercase tracking-wide mb-3">Datos del cliente</h2>
            <div className="bg-fondo rounded-2xl p-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-texto-suave font-semibold">Razón Social</p>
                <p className="font-bold text-texto text-base">{cliente?.razon_social}</p>
              </div>
              <div>
                <p className="text-xs text-texto-suave font-semibold">CUIT</p>
                <p className="font-mono text-texto text-base">{cliente?.cuit || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-texto-suave font-semibold">Domicilio</p>
                <p className="text-texto text-base">{cliente?.domicilio || '—'}</p>
              </div>
            </div>
          </motion.section>

          {/* Detalle de ítems */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <h2 className="text-xs font-bold text-texto-suave uppercase tracking-wide mb-3">
              Detalle del pedido — {items.length} {items.length === 1 ? 'producto' : 'productos'}
            </h2>
            <div className="rounded-2xl overflow-hidden border border-gray-100">
              <DetalleItems items={items} />
            </div>
          </motion.section>

          {/* Totales */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="bg-fondo rounded-2xl p-5 space-y-2"
          >
            <div className="flex justify-between items-center">
              <span className="font-extrabold text-texto text-lg">Total</span>
              <span className="text-2xl font-extrabold font-mono text-texto">
                {formatearPrecio(total)}
              </span>
            </div>
          </motion.section>

          {/* Botones */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex gap-3"
          >
            <button
              onClick={handleImprimir}
              disabled={imprimiendo}
              className="flex-1 flex items-center justify-center gap-2 py-4 border-2 border-gray-200
                         rounded-2xl text-base font-bold text-texto hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              {imprimiendo
                ? <div className="w-5 h-5 border-2 border-texto border-t-transparent rounded-full animate-spin" />
                : <Printer className="w-5 h-5" />}
              {imprimiendo ? 'Imprimiendo...' : 'Imprimir'}
            </button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={nuevoPedido}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-primario text-white
                         rounded-2xl text-base font-bold hover:bg-blue-700 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              Nuevo pedido
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
