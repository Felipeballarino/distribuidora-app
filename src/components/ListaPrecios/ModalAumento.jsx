import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { X, TrendingUp, ArrowRight } from 'lucide-react'
import { formatearPrecio } from '../../lib/utils'
import { parsearNumero, redondear } from '../../lib/pedido'

const RAPIDOS = [5, 10, 15, 20, 25]
const clave = (s) => String(s || '').trim().toLowerCase()

// Aumento (o baja, con número negativo) del COSTO de todos los productos de una marca o categoría.
export default function ModalAumento({ productos, onListo, onCerrar }) {
  const [criterio, setCriterio] = useState('marca')
  const [valor, setValor] = useState('')
  const [pctTxt, setPctTxt] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  // Marcas o categorías con la cantidad de productos de cada una
  const opciones = useMemo(() => {
    const mapa = new Map()
    for (const p of productos) {
      const nombre = String(p[criterio] || '').trim()
      if (!nombre) continue
      const k = clave(nombre)
      mapa.set(k, { nombre: mapa.get(k)?.nombre || nombre, cantidad: (mapa.get(k)?.cantidad || 0) + 1 })
    }
    return [...mapa.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  }, [productos, criterio])

  const pct = parsearNumero(pctTxt)
  const afectados = productos.filter((p) => valor && clave(p[criterio]) === clave(valor))
  const valido = afectados.length > 0 && pct !== null && pct !== 0 && pct > -100
  const nuevo = (costo) => redondear((Number(costo) || 0) * (1 + (pct || 0) / 100))

  const aplicar = async () => {
    if (!valido || guardando) return
    setGuardando(true)
    setError(null)
    const r = await window.api.productos.aumentar({ criterio, valor, porcentaje: pct })
    setGuardando(false)
    if (r?.ok === false) return setError(r.error)
    onListo(`Costos de ${valor}: ${pct > 0 ? '+' : ''}${String(pct).replace('.', ',')}% en ${r.productos} productos.`)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onMouseDown={onCerrar}>
      <motion.div
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.97, opacity: 0 }}
        transition={{ duration: 0.15 }}
        onMouseDown={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col"
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-borde">
          <h2 className="text-xl font-extrabold text-texto flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primario" /> Aumentar costos
          </h2>
          <button onClick={onCerrar} className="p-2 hover:bg-fondo rounded-lg"><X className="w-5 h-5 text-texto-suave" /></button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Marca o categoría */}
          <div>
            <div className="grid grid-cols-2 gap-1 bg-fondo rounded-lg p-1 mb-3">
              {[['marca', 'Por marca'], ['categoria', 'Por categoría']].map(([id, texto]) => (
                <button key={id} onClick={() => { setCriterio(id); setValor('') }}
                  className={`h-10 rounded-md font-bold ${criterio === id ? 'bg-white text-primario shadow-tarjeta' : 'text-texto-suave'}`}>
                  {texto}
                </button>
              ))}
            </div>
            <select
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="w-full h-12 px-3 text-base font-semibold border-2 border-borde rounded-lg bg-white focus:outline-none focus:border-primario"
            >
              <option value="">Elegí {criterio === 'marca' ? 'la marca' : 'la categoría'}…</option>
              {opciones.map((o) => (
                <option key={o.nombre} value={o.nombre}>{o.nombre} ({o.cantidad})</option>
              ))}
            </select>
            {opciones.length === 0 && (
              <p className="text-sm text-aviso mt-2">Ningún producto tiene {criterio} cargada. Se completa en cada producto o en el Excel.</p>
            )}
          </div>

          {/* Porcentaje */}
          <div>
            <label className="block text-sm font-bold text-texto-suave mb-1">Porcentaje</label>
            <div className="flex items-center gap-2">
              <div className="relative w-32">
                <input
                  inputMode="decimal"
                  value={pctTxt}
                  onChange={(e) => setPctTxt(e.target.value.replace(/[^\d.,-]/g, ''))}
                  placeholder="15"
                  className="w-full h-12 pr-8 text-center text-xl font-bold font-mono border-2 border-borde rounded-lg focus:outline-none focus:border-primario"
                />
                <span className="absolute right-3 inset-y-0 flex items-center font-bold text-texto-suave">%</span>
              </div>
              {RAPIDOS.map((n) => (
                <button key={n} onClick={() => setPctTxt(String(n))}
                  className={`h-12 px-3 rounded-lg font-bold border-2 ${pct === n ? 'border-primario text-primario bg-primario-suave' : 'border-borde text-texto-suave hover:text-texto'}`}>
                  +{n}
                </button>
              ))}
            </div>
            <p className="text-xs text-texto-suave mt-1.5">Para bajar, poné el número en negativo (ej: -5).</p>
          </div>

          {/* Vista previa */}
          {afectados.length > 0 && (
            <div className="rounded-lg border border-borde overflow-hidden">
              <p className="px-4 py-2 bg-fondo text-sm font-bold text-texto">
                {afectados.length} {afectados.length === 1 ? 'producto' : 'productos'} de {valor}
              </p>
              <ul className="divide-y divide-borde max-h-56 overflow-y-auto">
                {afectados.map((p) => (
                  <li key={p.cod_articulo} className="px-4 py-2 flex items-center gap-3 text-sm">
                    <span className="flex-1 truncate text-texto">{p.denominacion}</span>
                    <span className="font-mono text-texto-suave">{formatearPrecio(p.precio_neto)}</span>
                    {valido && (
                      <>
                        <ArrowRight className="w-3.5 h-3.5 text-texto-suave" />
                        <span className="font-mono font-bold text-texto w-28 text-right">{formatearPrecio(nuevo(p.precio_neto))}</span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-texto-suave">
            Cambia el costo de la lista. Los pedidos ya guardados y los precargados mantienen el precio con el que se cargaron.
          </p>
          {error && <p className="text-peligro font-bold">{error}</p>}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-borde">
          <button onClick={onCerrar} className="flex-1 h-12 border-2 border-borde rounded-lg font-bold hover:bg-fondo">Cancelar</button>
          <button
            onClick={aplicar}
            disabled={!valido || guardando}
            className="flex-[2] h-12 bg-primario text-white rounded-lg font-bold hover:bg-primario-oscuro disabled:opacity-40"
          >
            {guardando ? 'Aplicando…' : valido
              ? `Aplicar ${pct > 0 ? '+' : ''}${String(pct).replace('.', ',')}% a ${afectados.length} productos`
              : 'Aplicar'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
