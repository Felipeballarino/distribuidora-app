import { useState } from 'react'
import { Trash2, CheckCircle2, AlertTriangle, X, MapPin, ClipboardList, RotateCcw, ShoppingBasket, ArrowLeftRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import usePedidoStore from '../../store/pedidoStore'
import { formatearPrecio, formatearImporte } from '../../lib/utils'
import {
  superaStock, itemValido, tienePrecio, sufijoUnidad, textoStock, precioVenta, precioManualValido,
  actualizarItem as simular,
} from '../../lib/pedido'
import InputDecimal from '../ui/InputDecimal'

const MARGENES = [0, 10, 15, 20, 25, 30]

const claseCampo =
  'h-10 text-center font-bold font-mono bg-white border-2 border-borde rounded-lg ' +
  'focus:outline-none focus:border-primario focus:ring-4 focus:ring-primario/10'

function Contador({ valor, onCambiar, maximoAlcanzado }) {
  const boton = 'w-8 h-10 rounded-lg bg-fondo hover:bg-borde font-bold text-lg text-texto disabled:opacity-30'
  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onCambiar(valor - 1)} disabled={valor <= 0} className={boton} aria-label="Restar">−</button>
      <InputDecimal
        valor={valor}
        decimales={false}
        onConfirmar={(n) => onCambiar(n ?? 0)}
        className={`${claseCampo} w-10`}
      />
      <button onClick={() => onCambiar(valor + 1)} disabled={maximoAlcanzado} className={boton} aria-label="Sumar">+</button>
    </div>
  )
}

function LineaPedido({ item, bloquearSinStock, onCambiar, onQuitar }) {
  const invalido = !itemValido(item)
  const sinPrecio = !tienePrecio(item)
  const supera = superaStock(item)
  const manual = item.precio_manual != null

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.15 }}
      className={`px-4 py-3 border-b border-borde ${invalido || sinPrecio || (supera && bloquearSinStock) ? 'bg-peligro-suave' : ''}`}
    >
      <div className="flex items-start gap-2">
        <p className="flex-1 font-semibold text-texto leading-snug">{item.denominacion}</p>
        <p className="font-extrabold font-mono text-texto whitespace-nowrap">{formatearPrecio(item.subtotal)}</p>
        <button onClick={onQuitar} title="Quitar del pedido"
          className="-mr-2 -mt-1 w-8 h-8 flex items-center justify-center rounded-lg text-texto-suave hover:bg-peligro-suave hover:text-peligro">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
        {item.tipo !== 'suelto' && (
          <>
            <Contador
              valor={item.unidades}
              maximoAlcanzado={bloquearSinStock && superaStock(simular(item, { unidades: item.unidades + 1 }))}
              onCambiar={(u) => onCambiar({ unidades: Math.max(0, u) })}
            />
            <span className="text-sm text-texto-suave">{item.tipo === 'piezas' ? 'pzas' : 'u'}</span>
          </>
        )}
        {item.tipo !== 'unidad' && (
          <label className="flex items-center gap-1">
            <InputDecimal
              valor={item.peso_kg || null}
              placeholder="0,0"
              onConfirmar={(kg) => onCambiar({ peso_kg: kg ?? 0 })}
              title={item.tipo === 'piezas' ? 'Peso real (pesado en balanza)' : 'Kilos'}
              className={`${claseCampo} w-[72px] ${item.tipo === 'piezas' && !item.kg_editado ? 'text-texto-suave' : ''}`}
            />
            <span className="text-sm text-texto-suave">kg</span>
          </label>
        )}
        <span className="text-texto-suave">×</span>
        <label className="relative">
          <span className="absolute left-2 inset-y-0 flex items-center text-xs text-texto-suave pointer-events-none">$</span>
          <InputDecimal
            valor={item.precio_venta || null}
            placeholder="Precio"
            formato={formatearImporte}
            onConfirmar={(n) => {
              const delMargen = precioVenta(item.precio_costo, item.markup_pct)
              onCambiar({ precio_manual: n !== null && Math.abs(n - delMargen) > 0.004 ? precioManualValido(n) : null })
            }}
            title="Precio de venta. Escribilo para cambiarlo en este pedido."
            className={`${claseCampo} w-[100px] pl-4 text-right pr-2 ${manual ? 'border-aviso/50 text-aviso' : ''} ${sinPrecio ? 'border-peligro/50' : ''}`}
          />
        </label>
        <span className="text-xs text-texto-suave -ml-1">{sufijoUnidad(item)}</span>
      </div>

      <div className="mt-1.5 flex items-center gap-3 text-xs min-h-[20px]">
        {manual ? (
          <button onClick={() => onCambiar({ precio_manual: null })} className="text-aviso font-semibold hover:underline flex items-center gap-1">
            <RotateCcw className="w-3 h-3" /> Precio a mano · volver al margen
          </button>
        ) : (
          <label className="flex items-center gap-1 text-texto-suave">
            Margen
            <select
              value={item.markup_pct}
              onChange={(e) => onCambiar({ markup_pct: Number(e.target.value) })}
              className="h-6 rounded border border-borde bg-white px-1 font-semibold text-texto"
            >
              {[...new Set([...MARGENES, item.markup_pct])].sort((a, b) => a - b).map((m) => (
                <option key={m} value={m}>{m === 0 ? 'Sin margen' : `+${m}%`}</option>
              ))}
            </select>
          </label>
        )}
        {item.tipo === 'piezas' && !item.kg_editado && <span className="text-texto-suave">kg estimados: corregí con el peso real</span>}
      </div>

      {(invalido || sinPrecio || supera) && (
        <p className={`mt-1 flex items-center gap-1 text-xs font-bold ${invalido || sinPrecio || bloquearSinStock ? 'text-peligro' : 'text-aviso'}`}>
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {invalido ? 'Cargá la cantidad o quitalo'
            : sinPrecio ? 'Poné el precio: este producto no tiene costo cargado'
            : bloquearSinStock ? `No alcanza el stock: hay ${textoStock(item)}`
            : `Supera el stock (hay ${textoStock(item)}). Se puede vender igual.`}
        </p>
      )}
    </motion.li>
  )
}

export default function ResumenPedido() {
  const cliente = usePedidoStore((s) => s.cliente)
  const items = usePedidoStore((s) => s.items)
  const margenPedido = usePedidoStore((s) => s.margenPedido)
  const precargaId = usePedidoStore((s) => s.precargaId)
  const bloquearSinStock = usePedidoStore((s) => s.bloquearSinStock)
  const setMargenPedido = usePedidoStore((s) => s.setMargenPedido)
  const eliminarItem = usePedidoStore((s) => s.eliminarItem)
  const actualizarItem = usePedidoStore((s) => s.actualizarItem)
  const irA = usePedidoStore((s) => s.irA)
  const nuevoPedido = usePedidoStore((s) => s.nuevoPedido)
  const setComprobanteEmitido = usePedidoStore((s) => s.setComprobanteEmitido)
  const actualizarStockDisponible = usePedidoStore((s) => s.actualizarStockDisponible)
  const total = usePedidoStore((s) => s.getTotal())
  const hayInvalidos = usePedidoStore((s) => s.hayItemsInvalidos())
  const haySinPrecio = usePedidoStore((s) => s.hayItemsSinPrecio())
  const haySinStock = usePedidoStore((s) => s.hayItemsSinStock())

  const [guardando, setGuardando] = useState(null) // 'precarga' | 'pedido'
  const [error, setError] = useState(null)
  const [confirmandoCancelar, setConfirmandoCancelar] = useState(false)

  const bloqueado = items.length === 0 || hayInvalidos || haySinPrecio || haySinStock || !!guardando

  const manejarError = (resultado) => {
    if (resultado.error === 'STOCK_INSUFICIENTE') {
      actualizarStockDisponible(resultado.faltantes)
      setError('El stock cambió mientras cargabas. Ajustá los productos marcados en rojo.')
    } else {
      setError(resultado.error || 'No se pudo guardar.')
    }
  }

  const guardar = async (modo) => {
    if (bloqueado) return
    setGuardando(modo)
    setError(null)
    try {
      if (modo === 'precarga') {
        const r = await window.api.precargas.guardar({ id: precargaId, cliente, items, total, margen: margenPedido })
        if (r?.ok === false) return manejarError(r)
        nuevoPedido(`Precarga guardada: ${cliente.razon_social}. La mercadería queda reservada.`)
      } else {
        const r = await window.api.comprobantes.emitir({ cliente, items, totales: { total }, precarga_id: precargaId })
        if (r?.ok === false) return manejarError(r)
        setComprobanteEmitido(r)
      }
    } catch (err) {
      console.error('Error al guardar:', err)
      setError('No se pudo guardar. Probá de nuevo.')
    } finally {
      setGuardando(null)
    }
  }

  const cancelar = () => {
    if (items.length > 0 && !confirmandoCancelar) {
      setConfirmandoCancelar(true)
      setTimeout(() => setConfirmandoCancelar(false), 3000)
      return
    }
    nuevoPedido()
  }

  return (
    <aside className="w-[380px] xl:w-[440px] shrink-0 bg-white border-l border-borde flex flex-col shadow-panel">
      {/* Cliente */}
      <div className="px-5 pt-4 pb-3 border-b border-borde">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-texto-suave uppercase tracking-wide flex items-center gap-2">
              {precargaId ? (
                <span className="flex items-center gap-1 text-aviso"><ClipboardList className="w-3.5 h-3.5" /> Terminando precarga</span>
              ) : 'Pedido para'}
            </p>
            <p className="text-lg font-extrabold text-texto leading-tight truncate">{cliente?.razon_social}</p>
            {cliente?.domicilio && (
              <p className="text-sm text-texto-suave truncate flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{cliente.domicilio}</p>
            )}
          </div>
          <button onClick={() => irA('cliente')} title="Cambiar de cliente (mantiene los productos)"
            className="h-9 px-2.5 rounded-lg text-sm font-semibold text-texto-suave hover:bg-fondo hover:text-texto flex items-center gap-1">
            <ArrowLeftRight className="w-4 h-4" /> <span className="hidden xl:inline">Cambiar</span>
          </button>
          <button onClick={cancelar}
            className={`h-9 px-2.5 rounded-lg text-sm font-semibold flex items-center gap-1 transition-colors
              ${confirmandoCancelar ? 'bg-peligro text-white' : 'text-texto-suave hover:bg-peligro-suave hover:text-peligro'}`}>
            <X className="w-4 h-4" /> {confirmandoCancelar ? '¿Borrar todo?' : <span className="hidden xl:inline">Cancelar</span>}
          </button>
        </div>

        {/* Margen del pedido */}
        <div className="mt-3">
          <p className="text-xs font-semibold text-texto-suave mb-1">Margen del pedido</p>
          <div className="grid grid-cols-6 gap-1 bg-fondo rounded-lg p-1">
            {MARGENES.map((pct) => (
              <button
                key={pct}
                onClick={() => setMargenPedido(pct)}
                className={`h-9 rounded-md text-sm font-bold transition-colors
                  ${margenPedido === pct ? 'bg-white text-primario shadow-tarjeta' : 'text-texto-suave hover:text-texto'}`}
              >
                {pct === 0 ? '0%' : `${pct}%`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ítems */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-10 text-texto-suave">
            <ShoppingBasket className="w-10 h-10 mb-3 opacity-40" />
            <p className="font-semibold text-texto">Todavía no hay productos</p>
            <p className="text-sm mt-1">Buscá a la izquierda, escribí la cantidad y apretá Enter.</p>
          </div>
        ) : (
          <ul>
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <LineaPedido
                  key={item.cod_articulo}
                  item={item}
                  bloquearSinStock={bloquearSinStock}
                  onCambiar={(cambios) => actualizarItem(item.cod_articulo, cambios)}
                  onQuitar={() => eliminarItem(item.cod_articulo)}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      {/* Total y acciones */}
      <div className="border-t border-borde px-5 pt-3 pb-4 bg-white">
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-texto-suave font-semibold">
            Total · {items.length} {items.length === 1 ? 'producto' : 'productos'}
          </span>
          <span className="text-[28px] leading-none font-extrabold font-mono text-texto">{formatearPrecio(total)}</span>
        </div>

        {error && <p className="text-sm font-bold text-peligro bg-peligro-suave rounded-lg px-3 py-2 mb-3">{error}</p>}
        {!error && (hayInvalidos || haySinPrecio || haySinStock) && (
          <p className="text-sm font-semibold text-peligro mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 shrink-0" /> Corregí los productos marcados en rojo para seguir.
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => guardar('precarga')}
            disabled={bloqueado}
            title="Guarda el pedido sin imprimir y reserva la mercadería. Se termina después (por ej. a la mañana)."
            className="flex-1 h-14 rounded-xl border-2 border-borde font-bold text-texto hover:bg-fondo
                       disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {guardando === 'precarga' ? <span className="w-4 h-4 border-2 border-texto border-t-transparent rounded-full animate-spin" /> : <ClipboardList className="w-5 h-5" />}
            {precargaId ? 'Guardar' : 'Precargar'}
          </button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => guardar('pedido')}
            disabled={bloqueado}
            className="flex-[1.6] h-14 rounded-xl bg-secundario text-white text-lg font-extrabold hover:bg-emerald-800
                       disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {guardando === 'pedido' ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
            Confirmar pedido
          </motion.button>
        </div>
      </div>
    </aside>
  )
}
