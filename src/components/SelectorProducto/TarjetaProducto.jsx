import { useState } from 'react'
import { Check, RotateCcw } from 'lucide-react'
import { formatearPrecio, formatearImporte } from '../../lib/utils'
import {
  tipoCarga, costoDe, precioVenta, crearItem, kgEstimados, parsearNumero, formatearKg,
  superaStock, puedeAgregarse, disponibleDe, textoCantidadStock, precioManualValido,
} from '../../lib/pedido'
import InputDecimal from '../ui/InputDecimal'

// Fila del catálogo. Se carga la cantidad y Enter (o "Agregar") lo suma al pedido.
// El precio se puede escribir a mano; si no, sale del costo + margen.
const claseInput =
  'h-11 text-center text-lg font-bold font-mono bg-white border-2 border-borde rounded-lg ' +
  'focus:outline-none focus:border-primario focus:ring-4 focus:ring-primario/10 placeholder:text-slate-300'

export default function TarjetaProducto({
  producto, margen, itemEnPedido, reservaPropia = 0, bloquearSinStock, onAgregar, onNavegar,
}) {
  const tipo = tipoCarga(producto)
  const costo = costoDe(producto)
  const sufijo = tipo === 'unidad' ? '/u' : '/kg'

  const [cantidadTxt, setCantidadTxt] = useState(
    itemEnPedido ? String(tipo === 'suelto' ? itemEnPedido.peso_kg : itemEnPedido.unidades).replace('.', ',') : ''
  )
  const [precioManual, setPrecioManual] = useState(itemEnPedido?.precio_manual ?? null)
  const [agregado, setAgregado] = useState(false)

  // Lo que se cargaría: en blanco = 1 unidad/pieza; en suelto hay que poner los kg
  const cantidad = parsearNumero(cantidadTxt)
  const unidades = tipo === 'suelto' ? 0 : cantidad ?? 1
  const carga = {
    unidades,
    peso_kg: tipo === 'suelto' ? cantidad || 0 : itemEnPedido?.kg_editado && unidades === itemEnPedido.unidades
      ? itemEnPedido.peso_kg : 0,
    kg_editado: tipo === 'piezas' && !!itemEnPedido?.kg_editado && unidades === itemEnPedido.unidades,
    markup_pct: margen,
    precio_manual: precioManual,
  }
  const vista = crearItem(producto, carga, reservaPropia)
  const disponible = disponibleDe(producto, reservaPropia)
  const supera = superaStock(vista)
  const puede = puedeAgregarse(vista, { bloquearSinStock })
  const precioMargen = precioVenta(costo, margen)

  const agregar = () => {
    if (!puede) return
    onAgregar(carga)
    setAgregado(true)
    setTimeout(() => setAgregado(false), 900)
  }

  const alPresionarTecla = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); agregar(); onNavegar?.('buscar') }
    if (e.key === 'ArrowDown') { e.preventDefault(); onNavegar?.(e.currentTarget, 1) }
    if (e.key === 'ArrowUp') { e.preventDefault(); onNavegar?.(e.currentTarget, -1) }
  }

  // Línea de stock: discreta; solo resalta cuando falta
  const textoDisponible = disponible > 0
    ? `Disp. ${textoCantidadStock(disponible, producto)}`
    : 'Sin stock'
  const reservado = Number(producto.reservado) - (Number(reservaPropia) || 0)

  return (
    <div
      className={`flex items-center gap-3 pl-4 pr-3 py-2.5 border-b border-borde last:border-b-0 transition-colors
        ${itemEnPedido ? 'bg-secundario-suave/60' : 'bg-white hover:bg-fondo/60'}`}
    >
      {/* Producto */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-texto leading-snug line-clamp-2" title={producto.denominacion}>
          {itemEnPedido && <Check className="inline w-4 h-4 mr-1 -mt-0.5 text-secundario" strokeWidth={3} />}
          {producto.denominacion}
        </p>
        <p className="text-sm text-texto-suave truncate">
          {producto.marca && <span>{producto.marca} · </span>}
          <span className={disponible > 0 ? '' : bloquearSinStock ? 'text-peligro font-semibold' : 'text-aviso font-semibold'}>
            {textoDisponible}
          </span>
          {reservado > 0.0005 && <span> · {textoCantidadStock(reservado, producto)} precargado</span>}
          {tipo === 'piezas' && <span> · ≈ {formatearKg(producto.peso_promedio_kg)} c/u</span>}
        </p>
      </div>

      {/* Precio (editable) */}
      <div className="w-[112px] xl:w-[124px] shrink-0">
        <div className="relative">
          <span className="absolute left-2.5 inset-y-0 flex items-center text-sm text-texto-suave pointer-events-none">$</span>
          <InputDecimal
            valor={precioManual ?? (precioMargen || null)}
            placeholder="Precio"
            formato={formatearImporte}
            onConfirmar={(n) => setPrecioManual(n !== null && Math.abs(n - precioMargen) > 0.004 ? precioManualValido(n) : null)}
            title="Precio de venta. Escribilo para cambiarlo solo en este pedido."
            className={`w-full h-11 pl-6 pr-9 text-right font-bold font-mono rounded-lg border-2 bg-white
              focus:outline-none focus:border-primario focus:ring-4 focus:ring-primario/10
              ${precioManual ? 'border-aviso/50 text-aviso' : 'border-transparent hover:border-borde text-texto'}
              ${!(vista.precio_venta > 0) ? 'border-peligro/40' : ''}`}
          />
          <span className="absolute right-2 inset-y-0 flex items-center text-xs text-texto-suave pointer-events-none">{sufijo}</span>
        </div>
        <p className="text-[11px] text-right pr-1 h-4 leading-4">
          {precioManual ? (
            <button type="button" onClick={() => setPrecioManual(null)} className="text-aviso font-semibold hover:underline">
              <RotateCcw className="inline w-3 h-3 -mt-0.5" /> a mano
            </button>
          ) : costo > 0 ? (
            <span className="text-texto-suave">costo {formatearPrecio(costo)}</span>
          ) : (
            <span className="text-peligro font-semibold">sin costo: poné el precio</span>
          )}
        </p>
      </div>

      {/* Cantidad */}
      <div className="w-[112px] xl:w-[128px] shrink-0">
        <div className="flex items-center gap-2">
          <input
            data-cantidad
            inputMode={tipo === 'suelto' ? 'decimal' : 'numeric'}
            value={cantidadTxt}
            placeholder={tipo === 'suelto' ? '0,0' : '1'}
            onChange={(e) => setCantidadTxt(e.target.value.replace(tipo === 'suelto' ? /[^\d.,]/g : /[^\d]/g, ''))}
            onKeyDown={alPresionarTecla}
            onFocus={(e) => e.target.select()}
            disabled={bloquearSinStock && disponible <= 0}
            className={`${claseInput} w-16 xl:w-[72px] disabled:bg-fondo disabled:text-texto-suave`}
          />
          <span className="text-sm font-semibold text-texto-suave">
            {tipo === 'unidad' ? 'u' : tipo === 'piezas' ? 'pzas' : 'kg'}
          </span>
        </div>
        <p className={`text-[11px] h-4 leading-4 pl-1 ${supera ? (bloquearSinStock ? 'text-peligro font-semibold' : 'text-aviso font-semibold') : 'text-texto-suave'}`}>
          {supera && unidades + (cantidad || 0) > 0
            ? `${bloquearSinStock ? 'No alcanza' : 'Supera'}: hay ${textoCantidadStock(Math.max(0, disponible), producto)}`
            : tipo === 'piezas' ? `≈ ${formatearKg(vista.peso_kg)}` : ''}
        </p>
      </div>

      {/* Agregar */}
      <button
        type="button"
        onClick={agregar}
        disabled={!puede}
        className={`w-[88px] xl:w-[100px] h-11 -mt-4 shrink-0 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors
          disabled:bg-fondo disabled:text-slate-400 disabled:cursor-not-allowed
          ${agregado ? 'bg-secundario text-white' : itemEnPedido ? 'bg-white border-2 border-secundario/40 text-secundario hover:bg-secundario-suave' : 'bg-primario text-white hover:bg-primario-oscuro'}`}
      >
        {agregado ? <><Check className="w-4 h-4" strokeWidth={3} /> Listo</> : itemEnPedido ? 'Cambiar' : 'Agregar'}
      </button>
    </div>
  )
}
