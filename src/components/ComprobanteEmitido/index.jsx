import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Plus, Printer } from 'lucide-react'
import usePedidoStore from '../../store/pedidoStore'
import { formatearPrecio, formatearFecha } from '../../lib/utils'
import DetalleItems from '../DetalleItems'
import { getEmpresa } from '../../lib/empresa'
import { imprimirRemito } from '../../lib/imprimirRemito'

export default function ComprobanteEmitido() {
  const comprobanteEmitido = usePedidoStore((s) => s.comprobanteEmitido)
  const cliente = usePedidoStore((s) => s.cliente)
  const items = usePedidoStore((s) => s.items)
  const nuevoPedido = usePedidoStore((s) => s.nuevoPedido)
  const total = usePedidoStore((s) => s.getTotal())
  const [imprimiendo, setImprimiendo] = useState(false)

  const imprimir = () => {
    setImprimiendo(true)
    imprimirRemito({
      numero: comprobanteEmitido.numero,
      fecha: new Date().toISOString(),
      razon_social: cliente.razon_social,
      cuit: cliente.cuit,
      domicilio: cliente.domicilio,
      cod_cliente: cliente.cod_cliente,
      items,
      total_neto: total,
    }, getEmpresa())
    setTimeout(() => setImprimiendo(false), 1500)
  }

  return (
    <div className="max-w-3xl mx-auto px-8 py-8">
      {/* Confirmación + acciones (visibles sin bajar) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-borde shadow-tarjeta p-6 flex items-center gap-5"
      >
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
          className="w-14 h-14 rounded-full bg-secundario-suave flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-8 h-8 text-secundario" />
        </motion.div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-extrabold text-texto">Pedido guardado</h1>
          <p className="text-texto-suave">
            N° <span className="font-mono font-bold text-texto">{comprobanteEmitido?.numero}</span>
            {' · '}{cliente?.razon_social}{' · '}{formatearFecha(new Date())}
          </p>
        </div>
      </motion.div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          onClick={imprimir}
          disabled={imprimiendo}
          autoFocus
          className="h-14 rounded-xl bg-primario text-white text-lg font-bold hover:bg-primario-oscuro
                     flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {imprimiendo
            ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <Printer className="w-5 h-5" />}
          {imprimiendo ? 'Imprimiendo…' : 'Imprimir boleta'}
        </button>
        <button
          onClick={() => nuevoPedido()}
          className="h-14 rounded-xl border-2 border-borde bg-white text-lg font-bold text-texto hover:bg-fondo
                     flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" /> Nuevo pedido
        </button>
      </div>

      {/* Detalle */}
      <div className="mt-6 bg-white rounded-xl border border-borde shadow-tarjeta overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between border-b border-borde">
          <p className="font-bold text-texto">
            Detalle · {items.length} {items.length === 1 ? 'producto' : 'productos'}
          </p>
          {cliente?.domicilio && <p className="text-sm text-texto-suave truncate">{cliente.domicilio}</p>}
        </div>
        <DetalleItems items={items} />
        <div className="px-4 py-4 flex justify-between items-baseline border-t border-borde bg-fondo/60">
          <span className="font-bold text-texto text-lg">Total</span>
          <span className="text-2xl font-extrabold font-mono text-texto">{formatearPrecio(total)}</span>
        </div>
      </div>
    </div>
  )
}
