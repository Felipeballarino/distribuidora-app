import { useState, useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, PackagePlus, ClipboardCheck, History, X, Warehouse } from 'lucide-react'
import { formatearFecha } from '../../lib/utils'
import { parsearNumero, formatearKg } from '../../lib/pedido'

// Cantidad con su unidad: "45,5 kg" / "24 u"
const fmt = (cantidad, unidad) =>
  unidad === 'kg' ? formatearKg(cantidad) : `${(Number(cantidad) || 0).toLocaleString('es-AR')} u`

const TIPOS = {
  inicial: { texto: 'Stock inicial', clase: 'bg-gray-100 text-texto-suave' },
  ingreso: { texto: 'Ingreso', clase: 'bg-green-100 text-secundario' },
  venta: { texto: 'Venta', clase: 'bg-blue-100 text-primario' },
  ajuste: { texto: 'Ajuste', clase: 'bg-amber-100 text-amber-700' },
  anulacion: { texto: 'Anulación', clase: 'bg-purple-100 text-purple-700' },
}

const normalizar = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

function Modal({ titulo, onCerrar, children, ancho = 'max-w-md' }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onMouseDown={onCerrar}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
        onMouseDown={(e) => e.stopPropagation()}
        className={`bg-white rounded-2xl shadow-2xl w-full ${ancho} max-h-[90vh] flex flex-col`}
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-extrabold text-texto">{titulo}</h2>
          <button onClick={onCerrar} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-texto-suave" /></button>
        </div>
        {children}
      </motion.div>
    </div>
  )
}

// Ingresar mercadería o ajustar por conteo
function ModalMovimiento({ modo, producto, onListo, onCerrar }) {
  const esIngreso = modo === 'ingreso'
  const [cantidadTxt, setCantidadTxt] = useState('')
  const [nota, setNota] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  const cantidad = parsearNumero(cantidadTxt)
  const actual = Number(producto.stock) || 0
  const quedara = esIngreso ? actual + (cantidad || 0) : cantidad
  const diferencia = !esIngreso && cantidad !== null ? cantidad - actual : null
  const valido = esIngreso ? cantidad > 0 : cantidad !== null && cantidad >= 0

  const guardar = async (e) => {
    e.preventDefault()
    if (!valido || guardando) return
    setGuardando(true)
    const r = esIngreso
      ? await window.api.stock.ingresar(producto.cod_articulo, cantidad, nota)
      : await window.api.stock.ajustar(producto.cod_articulo, cantidad, nota)
    setGuardando(false)
    if (r?.ok === false) return setError(r.error)
    onListo()
  }

  const unidad = producto.unidad_medida === 'kg' ? 'kg' : 'unidades'
  return (
    <Modal titulo={esIngreso ? 'Ingresar mercadería' : 'Ajustar por conteo'} onCerrar={onCerrar}>
      <form onSubmit={guardar} className="p-6 space-y-4">
        <div className="bg-fondo rounded-xl p-4">
          <p className="font-bold text-texto">{producto.denominacion}</p>
          <p className="text-texto-suave">Stock actual: <b className="font-mono">{fmt(actual, producto.unidad_medida)}</b></p>
        </div>
        <div>
          <label className="block text-sm font-bold text-texto-suave mb-1">
            {esIngreso ? `¿Cuánto entra? (${unidad})` : `¿Cuánto hay contado? (${unidad})`}
          </label>
          <input
            autoFocus
            inputMode="decimal"
            value={cantidadTxt}
            onChange={(e) => setCantidadTxt(e.target.value.replace(/[^\d.,]/g, ''))}
            className="w-full h-14 text-2xl font-bold font-mono text-center border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primario"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-texto-suave mb-1">Nota (opcional)</label>
          <input
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder={esIngreso ? 'Ej: Remito proveedor 1234' : 'Ej: Conteo del lunes'}
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:border-primario"
          />
        </div>
        {valido && (
          <p className="text-base text-texto">
            Queda en <b className="font-mono">{fmt(quedara, producto.unidad_medida)}</b>
            {diferencia !== null && Math.abs(diferencia) > 0.0005 && (
              <span className={diferencia < 0 ? 'text-peligro' : 'text-secundario'}>
                {' '}({diferencia > 0 ? '+' : ''}{fmt(diferencia, producto.unidad_medida)})
              </span>
            )}
          </p>
        )}
        {error && <p className="text-peligro font-bold">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onCerrar} className="flex-1 h-12 border-2 border-gray-200 rounded-2xl font-bold hover:bg-gray-50">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!valido || guardando}
            className={`flex-1 h-12 text-white rounded-2xl font-bold disabled:opacity-40
              ${esIngreso ? 'bg-secundario hover:bg-green-700' : 'bg-amber-600 hover:bg-amber-700'}`}
          >
            {guardando ? 'Guardando...' : esIngreso ? 'Ingresar' : 'Guardar ajuste'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function ModalHistorial({ producto, onCerrar }) {
  const [movimientos, setMovimientos] = useState(null)
  useEffect(() => {
    window.api.stock.movimientos(producto?.cod_articulo).then(setMovimientos)
  }, [producto])

  return (
    <Modal titulo={producto ? `Movimientos — ${producto.denominacion}` : 'Últimos movimientos'} onCerrar={onCerrar} ancho="max-w-4xl">
      <div className="overflow-y-auto flex-1">
        {!movimientos ? (
          <p className="p-8 text-center text-texto-suave">Cargando...</p>
        ) : movimientos.length === 0 ? (
          <p className="p-8 text-center text-texto-suave">Todavía no hay movimientos.</p>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-fondo sticky top-0">
              <tr className="text-xs font-bold text-texto-suave uppercase">
                <th className="px-4 py-2.5">Fecha</th>
                {!producto && <th className="px-4 py-2.5">Producto</th>}
                <th className="px-4 py-2.5">Tipo</th>
                <th className="px-4 py-2.5 text-right">Cantidad</th>
                <th className="px-4 py-2.5 text-right">Saldo</th>
                <th className="px-4 py-2.5">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((m) => (
                <tr key={m.id} className="border-t border-gray-50">
                  <td className="px-4 py-2.5 text-sm text-texto-suave whitespace-nowrap">{formatearFecha(m.fecha)}</td>
                  {!producto && <td className="px-4 py-2.5 text-sm font-semibold">{m.denominacion || m.cod_articulo}</td>}
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${TIPOS[m.tipo]?.clase || ''}`}>
                      {TIPOS[m.tipo]?.texto || m.tipo}
                    </span>
                  </td>
                  <td className={`px-4 py-2.5 text-right font-mono font-bold ${m.cantidad < 0 ? 'text-peligro' : 'text-secundario'}`}>
                    {m.cantidad > 0 ? '+' : ''}{fmt(m.cantidad, m.unidad_medida)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">{fmt(m.stock_resultante, m.unidad_medida)}</td>
                  <td className="px-4 py-2.5 text-sm text-texto-suave">
                    {m.referencia && <span className="font-mono">#{m.referencia} </span>}
                    {m.nota}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Modal>
  )
}

export default function ControlStock() {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [soloSinStock, setSoloSinStock] = useState(false)
  const [modal, setModal] = useState(null) // { tipo: 'ingreso'|'ajuste'|'historial', producto }

  const cargar = async () => {
    setCargando(true)
    setProductos(await window.api.productos.listar())
    setCargando(false)
  }
  useEffect(() => { cargar() }, [])

  const filtrados = useMemo(() => {
    const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean)
    return productos.filter((p) => {
      if (soloSinStock && Number(p.stock) > 0) return false
      const texto = normalizar(`${p.denominacion} ${p.marca} ${p.cod_articulo} ${p.categoria}`)
      return palabras.every((w) => texto.includes(w))
    })
  }, [productos, busqueda, soloSinStock])

  const sinStock = productos.filter((p) => !(Number(p.stock) > 0)).length

  const cerrarYRecargar = () => { setModal(null); cargar() }

  return (
    <div className="h-full flex flex-col p-6 bg-fondo">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-texto">Stock</h1>
          <p className="text-texto-suave mt-0.5">
            {productos.length} productos · <span className={sinStock ? 'text-peligro font-bold' : ''}>{sinStock} sin stock</span>
          </p>
        </div>
        <button
          onClick={() => setModal({ tipo: 'historial', producto: null })}
          className="flex items-center gap-2 px-4 h-12 border-2 border-gray-200 bg-white rounded-2xl font-bold hover:bg-gray-50"
        >
          <History className="w-4 h-4" /> Últimos movimientos
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-texto-suave pointer-events-none" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar producto, marca o código..."
            className="w-full pl-12 pr-4 h-12 text-base rounded-2xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primario"
          />
        </div>
        <button
          onClick={() => setSoloSinStock((v) => !v)}
          className={`px-4 h-12 rounded-2xl font-bold border-2 ${soloSinStock ? 'bg-peligro text-white border-peligro' : 'bg-white border-gray-200 text-texto-suave'}`}
        >
          Solo sin stock
        </button>
      </div>

      <div className="flex-1 overflow-auto bg-white rounded-2xl shadow-sm border border-gray-100">
        {cargando ? (
          <div className="flex items-center justify-center h-48 text-texto-suave text-lg">Cargando...</div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-texto-suave gap-3">
            <Warehouse className="w-12 h-12 opacity-30" />
            <p className="text-lg font-semibold">No hay productos para mostrar</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-fondo border-b border-gray-100 sticky top-0 z-10">
              <tr className="text-xs font-bold text-texto-suave uppercase tracking-wide">
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p, i) => {
                const hay = Number(p.stock) > 0
                return (
                  <tr key={p.cod_articulo} className={`border-b border-gray-50 ${i % 2 ? 'bg-gray-50/40' : ''}`}>
                    <td className="px-4 py-3 font-mono text-sm text-texto-suave">{p.cod_articulo}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-texto">{p.denominacion}</p>
                      {p.marca && <p className="text-xs text-texto-suave">{p.marca}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-texto-suave">{p.categoria}</td>
                    <td className={`px-4 py-3 text-right font-mono font-bold text-lg ${hay ? 'text-texto' : 'text-peligro'}`}>
                      {hay ? fmt(p.stock, p.unidad_medida) : 'Sin stock'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => setModal({ tipo: 'ingreso', producto: p })}
                          className="flex items-center gap-1.5 px-3 h-10 rounded-xl bg-green-50 text-secundario font-bold text-sm hover:bg-green-100"
                        >
                          <PackagePlus className="w-4 h-4" /> Ingresar
                        </button>
                        <button
                          onClick={() => setModal({ tipo: 'ajuste', producto: p })}
                          className="flex items-center gap-1.5 px-3 h-10 rounded-xl bg-amber-50 text-amber-700 font-bold text-sm hover:bg-amber-100"
                        >
                          <ClipboardCheck className="w-4 h-4" /> Ajustar
                        </button>
                        <button
                          onClick={() => setModal({ tipo: 'historial', producto: p })}
                          title="Ver movimientos"
                          className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100 text-texto-suave"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {modal?.tipo === 'historial' && <ModalHistorial producto={modal.producto} onCerrar={() => setModal(null)} />}
        {(modal?.tipo === 'ingreso' || modal?.tipo === 'ajuste') && (
          <ModalMovimiento modo={modal.tipo} producto={modal.producto} onListo={cerrarYRecargar} onCerrar={() => setModal(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
