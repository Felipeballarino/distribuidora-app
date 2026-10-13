import { useState } from 'react'
import { Trash2, ArrowLeft, CheckCircle, User, MapPin, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import usePedidoStore from '../../store/pedidoStore'
import { formatearPrecio } from '../../lib/utils'
import { parsearNumero, superaStock, itemValido, sufijoUnidad, textoStock, actualizarItem as simular } from '../../lib/pedido'

// Input de kg que acepta coma decimal y confirma al salir o con Enter
function InputKg({ valor, onConfirmar }) {
  const [texto, setTexto] = useState(null)
  const mostrado = texto ?? String(valor || '').replace('.', ',')
  const confirmar = () => {
    if (texto === null) return
    const n = parsearNumero(texto)
    if (n !== null && n >= 0) onConfirmar(n)
    setTexto(null)
  }
  return (
    <input
      inputMode="decimal"
      value={mostrado}
      onChange={(e) => setTexto(e.target.value.replace(/[^\d.,]/g, ''))}
      onBlur={confirmar}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      onFocus={(e) => e.target.select()}
      className="w-20 h-10 text-center font-bold font-mono border-2 border-gray-200 rounded-lg
                 focus:outline-none focus:border-primario"
    />
  )
}

function Contador({ valor, onCambiar, maximoAlcanzado }) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onCambiar(valor - 1)}
        disabled={valor <= 0}
        className="w-9 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 font-bold text-lg disabled:opacity-30"
      >
        −
      </button>
      <span className="w-10 text-center font-bold font-mono tabular-nums">{valor}</span>
      <button
        onClick={() => onCambiar(valor + 1)}
        disabled={maximoAlcanzado}
        className="w-9 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 font-bold text-lg disabled:opacity-30"
      >
        +
      </button>
    </div>
  )
}

export default function ResumenPedido() {
  const cliente = usePedidoStore((s) => s.cliente)
  const items = usePedidoStore((s) => s.items)
  const eliminarItem = usePedidoStore((s) => s.eliminarItem)
  const actualizarItem = usePedidoStore((s) => s.actualizarItem)
  const irA = usePedidoStore((s) => s.irA)
  const setComprobanteEmitido = usePedidoStore((s) => s.setComprobanteEmitido)
  const total = usePedidoStore((s) => s.getTotal())
  const hayInvalidos = usePedidoStore((s) => s.hayItemsInvalidos())
  const haySinStock = usePedidoStore((s) => s.hayItemsSinStock())
  const actualizarStockDisponible = usePedidoStore((s) => s.actualizarStockDisponible)

  const [emitiendo, setEmitiendo] = useState(false)
  const [error, setError] = useState(null)

  const emitir = async () => {
    if (emitiendo || items.length === 0 || hayInvalidos || haySinStock) return
    setEmitiendo(true)
    setError(null)
    try {
      const resultado = await window.api.comprobantes.emitir({ cliente, items, totales: { total } })
      if (resultado?.ok === false) {
        if (resultado.error === 'STOCK_INSUFICIENTE') {
          // Otro pedido se llevó el stock mientras cargábamos: mostrar lo que hay realmente
          actualizarStockDisponible(resultado.faltantes)
          setError('El stock cambió mientras cargabas el pedido. Ajustá los productos marcados en rojo.')
        } else {
          setError(resultado.error || 'No se pudo guardar el pedido.')
        }
        return
      }
      setComprobanteEmitido(resultado)
    } catch (err) {
      console.error('Error al emitir:', err)
      setError('No se pudo guardar el pedido. Probá de nuevo.')
    } finally {
      setEmitiendo(false)
    }
  }

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 flex-shrink-0">
        <button onClick={() => irA('productos')} className="p-3 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-6 h-6 text-texto" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-extrabold text-texto">Resumen del pedido</h2>
          <p className="flex items-center gap-1.5 text-base text-texto-suave truncate">
            <User className="w-4 h-4 shrink-0" />
            {cliente?.razon_social}
            {cliente?.domicilio && (
              <>
                <MapPin className="w-4 h-4 ml-1 shrink-0" />
                {cliente.domicilio}
              </>
            )}
          </p>
        </div>
        <span className="shrink-0 text-sm font-bold text-texto-suave bg-gray-100 px-3 py-1 rounded-full">
          {items.length} {items.length === 1 ? 'producto' : 'productos'}
        </span>
      </div>

      {/* Ítems */}
      <div className="flex-1 overflow-y-auto p-4">
        {items.length === 0 ? (
          <div className="text-center text-texto-suave py-16 text-lg">No hay productos en el pedido</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="grid grid-cols-[1fr_7rem_6rem_8rem_8rem_2.5rem] gap-3 px-4 py-2.5 bg-fondo border-b border-gray-100
                            text-xs font-bold text-texto-suave uppercase tracking-wide">
              <span>Producto</span>
              <span className="text-center">Cant.</span>
              <span className="text-center">Kg</span>
              <span className="text-right">Precio</span>
              <span className="text-right">Subtotal</span>
              <span />
            </div>

            <AnimatePresence initial={false}>
              {items.map((item, idx) => {
                const invalido = !itemValido(item)
                const sinStock = superaStock(item)
                return (
                  <motion.div
                    key={item.cod_articulo}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    className={`grid grid-cols-[1fr_7rem_6rem_8rem_8rem_2.5rem] gap-3 px-4 py-3 items-center border-b border-gray-50
                      ${invalido || sinStock ? 'bg-red-50' : idx % 2 === 1 ? 'bg-gray-50/40' : ''}`}
                  >
                    <div>
                      <p className="font-semibold text-texto leading-tight">{item.denominacion}</p>
                      <p className="text-xs text-texto-suave">
                        {item.markup_pct ? `Margen +${item.markup_pct}%` : 'Sin margen'}
                        {item.tipo === 'piezas' && !item.kg_editado && ' · kg estimados'}
                      </p>
                      {invalido && (
                        <p className="flex items-center gap-1 text-xs font-bold text-peligro mt-0.5">
                          <AlertTriangle className="w-3 h-3" /> Cargá la cantidad o quitalo
                        </p>
                      )}
                      {sinStock && (
                        <p className="flex items-center gap-1 text-xs font-bold text-peligro mt-0.5">
                          <AlertTriangle className="w-3 h-3" /> Solo hay {textoStock(item)}
                        </p>
                      )}
                    </div>

                    {/* Unidades / piezas */}
                    <div className="flex justify-center">
                      {item.tipo === 'suelto' ? (
                        <span className="text-texto-suave">—</span>
                      ) : (
                        <Contador
                          valor={item.unidades}
                          maximoAlcanzado={superaStock(simular(item, { unidades: item.unidades + 1 }))}
                          onCambiar={(u) => actualizarItem(item.cod_articulo, { unidades: Math.max(0, u) })}
                        />
                      )}
                    </div>

                    {/* Kg */}
                    <div className="flex justify-center">
                      {item.tipo === 'unidad' ? (
                        <span className="text-texto-suave">—</span>
                      ) : (
                        <InputKg
                          valor={item.peso_kg}
                          onConfirmar={(kg) => actualizarItem(item.cod_articulo, { peso_kg: kg })}
                        />
                      )}
                    </div>

                    <p className="text-right font-mono text-texto-suave tabular-nums">
                      {formatearPrecio(item.precio_venta)}
                      <span className="text-xs">{sufijoUnidad(item)}</span>
                    </p>
                    <p className="text-right font-extrabold font-mono text-texto tabular-nums">
                      {formatearPrecio(item.subtotal)}
                    </p>
                    <button
                      onClick={() => eliminarItem(item.cod_articulo)}
                      className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-red-50 text-peligro transition-colors"
                      title="Quitar del pedido"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <span className="text-texto-suave font-semibold text-lg">Total del pedido</span>
          <span className="text-3xl font-extrabold font-mono text-texto tabular-nums">{formatearPrecio(total)}</span>
        </div>

        {haySinStock && (
          <p className="flex items-center gap-2 text-sm font-bold text-peligro bg-red-50 rounded-xl px-4 py-2.5 mb-3">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Hay productos sin stock suficiente. Bajá la cantidad o quitalos para confirmar.
          </p>
        )}
        {hayInvalidos && (
          <p className="flex items-center gap-2 text-sm font-bold text-peligro bg-red-50 rounded-xl px-4 py-2.5 mb-3">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Hay productos sin cantidad. Cargala o quitalos para emitir.
          </p>
        )}
        {error && (
          <p className="text-sm font-bold text-peligro bg-red-50 rounded-xl px-4 py-2.5 mb-3">{error}</p>
        )}

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={emitir}
          disabled={emitiendo || items.length === 0 || hayInvalidos || haySinStock}
          className="w-full py-4 bg-secundario text-white rounded-2xl text-xl font-extrabold
                     flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed
                     hover:bg-green-700 transition-colors"
        >
          {emitiendo ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <CheckCircle className="w-6 h-6" />
              Confirmar pedido
            </>
          )}
        </motion.button>
      </div>
    </div>
  )
}
