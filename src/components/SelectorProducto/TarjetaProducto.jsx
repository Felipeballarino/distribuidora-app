import { useState, useMemo } from 'react'
import { Plus, Minus, Percent, AlertTriangle, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatearPrecio } from '../../lib/utils'
import {
  tipoCarga, costoDe, precioVenta, crearItem, kgEstimados, parsearNumero,
  formatearKg, itemValido, superaStock,
} from '../../lib/pedido'

// Texto que se muestra en el input de kg ("45,0")
const kgATexto = (kg) => (kg ? String(Number(kg)).replace('.', ',') : '')

function BotonPaso({ onClick, disabled, children, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="w-11 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center
                 transition-colors shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  )
}

const claseInput =
  'flex-1 w-0 h-11 text-center text-lg font-bold font-mono border-2 border-gray-200 rounded-xl ' +
  'focus:outline-none focus:border-primario'

export default function TarjetaProducto({ producto, margen, onCambiarMargen, itemEnPedido, onAgregar, indice }) {
  const tipo = tipoCarga(producto)
  const costo = costoDe(producto)
  const precio = precioVenta(costo, margen)
  const sufijo = tipo === 'unidad' ? '/u' : '/kg'

  // Estado de lo que está cargando el operador (como texto, para aceptar "4,5")
  const [unidadesTxt, setUnidadesTxt] = useState(
    itemEnPedido ? String(itemEnPedido.unidades || '') : tipo === 'suelto' ? '' : '1'
  )
  const [kgTxt, setKgTxt] = useState(itemEnPedido ? kgATexto(itemEnPedido.peso_kg) : '')
  const [kgEditado, setKgEditado] = useState(tipo === 'suelto' || !!itemEnPedido?.kg_editado)
  const [agregado, setAgregado] = useState(false)

  const unidades = parsearNumero(unidadesTxt) || 0
  // En 'piezas', si no cargaron el peso real, los kg salen del peso promedio
  const kgMostrados =
    tipo === 'piezas' && !kgEditado ? kgATexto(kgEstimados(unidades, producto.peso_promedio_kg)) : kgTxt

  const carga = {
    unidades,
    peso_kg: parsearNumero(kgMostrados) || 0,
    kg_editado: tipo === 'piezas' && kgEditado,
    markup_pct: margen,
  }
  const vistaPrevia = useMemo(() => crearItem(producto, carga), [producto, unidades, kgMostrados, kgEditado, margen]) // eslint-disable-line react-hooks/exhaustive-deps
  const puedeAgregar = itemValido(vistaPrevia)
  const avisoStock = superaStock(vistaPrevia)

  const cambiarUnidades = (delta) => setUnidadesTxt(String(Math.max(0, Math.round(unidades + delta))))
  const cambiarKg = (delta) => {
    const actual = parsearNumero(kgMostrados) || 0
    setKgEditado(true)
    setKgTxt(kgATexto(Math.max(0, Math.round((actual + delta) * 10) / 10)))
  }

  const agregar = () => {
    if (!puedeAgregar) return
    onAgregar(carga)
    setAgregado(true)
    setTimeout(() => setAgregado(false), 1000)
  }

  const alPresionarTecla = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      agregar()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(indice * 0.02, 0.3) }}
      className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden flex flex-col
        ${itemEnPedido ? 'border-secundario/40' : 'border-gray-100'}`}
    >
      {/* Encabezado */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-start gap-2">
          <p className="flex-1 text-base font-bold text-texto leading-tight line-clamp-2 min-h-[2.5rem]">
            {producto.denominacion}
          </p>
          <span className={`shrink-0 text-xs font-bold px-2 py-1 rounded-lg
            ${tipo === 'unidad' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
            {tipo === 'unidad' ? 'x unidad' : 'x kg'}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {producto.marca && <span className="text-sm text-texto-suave">{producto.marca}</span>}
          {producto.stock != null && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-texto-suave">
              Stock: {tipo === 'unidad' ? producto.stock : formatearKg(producto.stock)}
            </span>
          )}
          {itemEnPedido && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-secundario">
              En el pedido
            </span>
          )}
        </div>
      </div>

      {/* Precio: costo + margen = precio de venta */}
      <div className="mx-4 mb-3 bg-gray-50 rounded-xl px-3 py-2 flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-texto-suave">Costo {formatearPrecio(costo)}</p>
          <p className="text-xl font-extrabold font-mono text-primario leading-tight">
            {formatearPrecio(precio)}<span className="text-sm text-texto-suave">{sufijo}</span>
          </p>
        </div>
        <label className="flex items-center gap-1 bg-white border-2 border-gray-200 rounded-lg px-2 h-10
                          focus-within:border-primario" title="Margen sobre el costo">
          <span className="text-sm font-bold text-texto-suave">+</span>
          <input
            type="number"
            min="0"
            step="1"
            value={margen === 0 ? '' : margen}
            placeholder="0"
            onChange={(e) => {
              const v = parseFloat(e.target.value)
              onCambiarMargen(isNaN(v) || v < 0 ? 0 : v)
            }}
            className="w-10 text-center text-base font-bold font-mono bg-transparent focus:outline-none"
          />
          <Percent className="w-4 h-4 text-texto-suave" />
        </label>
      </div>

      {/* Cantidades según cómo se vende el producto */}
      <div className="px-4 pb-3 space-y-2">
        {tipo !== 'suelto' && (
          <div>
            <p className="text-sm text-texto-suave mb-1 font-semibold">
              {tipo === 'piezas' ? 'Piezas' : 'Unidades'}
            </p>
            <div className="flex items-center gap-1.5">
              <BotonPaso label="Restar" onClick={() => cambiarUnidades(-1)} disabled={unidades <= 0}>
                <Minus className="w-5 h-5 text-texto" />
              </BotonPaso>
              <input
                inputMode="numeric"
                value={unidadesTxt}
                onChange={(e) => setUnidadesTxt(e.target.value.replace(/[^\d]/g, ''))}
                onKeyDown={alPresionarTecla}
                onFocus={(e) => e.target.select()}
                className={claseInput}
              />
              <BotonPaso label="Sumar" onClick={() => cambiarUnidades(1)}>
                <Plus className="w-5 h-5 text-texto" />
              </BotonPaso>
            </div>
          </div>
        )}

        {tipo !== 'unidad' && (
          <div>
            <p className="text-sm text-texto-suave mb-1 font-semibold flex justify-between">
              <span>Kilos</span>
              {tipo === 'piezas' && (
                <span className="font-normal">
                  {kgEditado ? (
                    <button
                      type="button"
                      onClick={() => { setKgEditado(false); setKgTxt('') }}
                      className="text-primario underline"
                    >
                      volver a estimado
                    </button>
                  ) : (
                    `≈ ${formatearKg(producto.peso_promedio_kg)} c/u`
                  )}
                </span>
              )}
            </p>
            <div className="flex items-center gap-1.5">
              <BotonPaso label="Restar kilos" onClick={() => cambiarKg(-0.5)}>
                <Minus className="w-5 h-5 text-texto" />
              </BotonPaso>
              <input
                inputMode="decimal"
                value={kgMostrados}
                placeholder="0,0"
                onChange={(e) => {
                  setKgEditado(true)
                  setKgTxt(e.target.value.replace(/[^\d.,]/g, ''))
                }}
                onKeyDown={alPresionarTecla}
                onFocus={(e) => e.target.select()}
                className={`${claseInput} ${tipo === 'piezas' && !kgEditado ? 'text-texto-suave' : ''}`}
              />
              <BotonPaso label="Sumar kilos" onClick={() => cambiarKg(0.5)}>
                <Plus className="w-5 h-5 text-texto" />
              </BotonPaso>
            </div>
          </div>
        )}

        {avisoStock && (
          <p className="flex items-center gap-1 text-xs font-bold text-amber-700">
            <AlertTriangle className="w-3.5 h-3.5" /> Supera el stock cargado
          </p>
        )}
      </div>

      {/* Subtotal + agregar */}
      <div className="mt-auto flex items-center gap-2 px-4 pb-4">
        <div className="flex-1">
          <p className="text-xs text-texto-suave">Subtotal</p>
          <p className="text-lg font-extrabold font-mono text-texto">{formatearPrecio(vistaPrevia.subtotal)}</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={agregar}
          disabled={!puedeAgregar}
          className={`h-12 px-5 rounded-xl font-bold text-base transition-colors shrink-0 flex items-center gap-1.5
            disabled:bg-gray-200 disabled:text-texto-suave disabled:cursor-not-allowed
            ${agregado ? 'bg-secundario text-white' : 'bg-primario text-white hover:bg-blue-700'}`}
        >
          {agregado ? <><Check className="w-5 h-5" /> Listo</> : itemEnPedido ? 'Actualizar' : 'Agregar'}
        </motion.button>
      </div>
    </motion.div>
  )
}
