import { useState, useEffect, Fragment } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, FileText, Printer, X, ChevronDown, ChevronUp } from 'lucide-react'
import { formatearPrecio, formatearFecha } from '../../lib/utils'
import { getEmpresa } from '../../lib/empresa'
import { imprimirRemito } from '../../lib/imprimirRemito'

function ModalComprobante({ comprobante, onCerrar }) {
  const [imprimiendo, setImprimiendo] = useState(false)

  const handleImprimir = () => {
    setImprimiendo(true)
    imprimirRemito(comprobante, getEmpresa())
    setTimeout(() => setImprimiendo(false), 1500)
  }

  const totales = {
    neto: comprobante.total_neto,
    iva: comprobante.total_iva,
    total: comprobante.total_final,
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <p className="text-xs text-texto-suave font-semibold">Comprobante</p>
            <p className="text-xl font-extrabold font-mono text-primario">N° {comprobante.numero}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleImprimir}
              disabled={imprimiendo}
              className="flex items-center gap-2 px-4 py-2.5 bg-primario text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {imprimiendo
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Printer className="w-4 h-4" />}
              {imprimiendo ? 'Imprimiendo...' : 'Imprimir'}
            </button>
            <button
              onClick={onCerrar}
              className="p-2.5 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4 text-texto-suave" />
            </button>
          </div>
        </div>

        {/* Contenido scrollable */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">

          {/* Header empresa + comprobante */}
          <div className="flex justify-between items-start border-b-2 border-primario pb-4">
            <div>
              <p className="text-base font-extrabold text-primario">Distribuidora</p>
              <p className="text-xs text-texto-suave mt-0.5">{formatearFecha(comprobante.fecha)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-texto-suave">Comprobante N°</p>
              <p className="text-xl font-extrabold font-mono text-primario">{comprobante.numero}</p>
            </div>
          </div>

          {/* Datos del cliente */}
          <div>
            <p className="text-xs font-bold text-texto-suave uppercase tracking-wide mb-2">Datos del cliente</p>
            <div className="grid grid-cols-2 gap-3 bg-fondo rounded-xl p-3">
              <div>
                <p className="text-xs text-texto-suave font-semibold">Razón Social</p>
                <p className="font-bold text-texto text-sm">{comprobante.razon_social}</p>
              </div>
              <div>
                <p className="text-xs text-texto-suave font-semibold">Código</p>
                <p className="font-mono text-texto text-sm">{comprobante.cod_cliente}</p>
              </div>
            </div>
          </div>

          {/* Detalle de ítems */}
          <div>
            <p className="text-xs font-bold text-texto-suave uppercase tracking-wide mb-2">
              Detalle — {comprobante.items.length} {comprobante.items.length === 1 ? 'producto' : 'productos'}
            </p>
            <div className="rounded-xl overflow-hidden border border-gray-100">
              <table className="w-full text-left">
                <thead className="bg-fondo">
                  <tr>
                    <th className="px-3 py-2 text-xs font-bold text-texto-suave">Producto</th>
                    <th className="px-3 py-2 text-xs font-bold text-texto-suave text-center">Unid.</th>
                    <th className="px-3 py-2 text-xs font-bold text-texto-suave text-center">Kg</th>
                    <th className="px-3 py-2 text-xs font-bold text-texto-suave text-right">Precio</th>
                    <th className="px-3 py-2 text-xs font-bold text-texto-suave text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {comprobante.items.map((item, i) => {
                    const precio = item.precio_venta_neto ?? item.precio_venta_con_iva ?? 0
                    const subtotal = precio * item.cantidad
                    return (
                      <tr key={i} className={`border-t border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                        <td className="px-3 py-2 font-semibold text-texto text-sm">{item.denominacion}</td>
                        <td className="px-3 py-2 text-center font-mono text-sm">{item.unidades || '—'}</td>
                        <td className="px-3 py-2 text-center font-mono text-sm">
                          {item.peso_kg > 0 ? `${item.peso_kg} kg` : '—'}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-sm">{formatearPrecio(precio)}</td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-sm text-primario">
                          {formatearPrecio(subtotal)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total */}
          <div className="bg-fondo rounded-xl px-4 py-3 flex justify-between items-center">
            <span className="font-extrabold text-texto text-lg">Total</span>
            <span className="text-2xl font-extrabold font-mono text-texto">
              {formatearPrecio(totales.neto)}
            </span>
          </div>

        </div>
      </motion.div>
    </div>
  )
}

export default function ListaVentas() {
  const [ventas, setVentas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [expandidos, setExpandidos] = useState({})
  const [modalVenta, setModalVenta] = useState(null)

  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      const data = await window.api.comprobantes.listar()
      setVentas(data)
      setCargando(false)
    }
    cargar()
  }, [])

  const filtrados = ventas.filter((v) => {
    const q = busqueda.toLowerCase()
    return (
      v.numero.includes(q) ||
      v.razon_social.toLowerCase().includes(q) ||
      v.cod_cliente.toLowerCase().includes(q)
    )
  })

  const toggleExpandir = (id) => {
    setExpandidos((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="h-full flex flex-col p-6 bg-fondo">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-texto">Historial de Ventas</h1>
          <p className="text-texto-suave mt-0.5">{ventas.length} comprobantes emitidos</p>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-texto-suave pointer-events-none" />
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por número, cliente o código..."
          className="w-full pl-12 pr-4 py-3 text-base rounded-2xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primario"
        />
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-auto bg-white rounded-2xl shadow-sm border border-gray-100">
        {cargando ? (
          <div className="flex items-center justify-center h-48 text-texto-suave text-lg">Cargando...</div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-texto-suave gap-3">
            <FileText className="w-12 h-12 opacity-30" />
            <p className="text-lg font-semibold">
              {busqueda ? 'Sin resultados para la búsqueda' : 'Todavía no hay comprobantes emitidos.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-fondo border-b border-gray-100 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-xs font-bold text-texto-suave uppercase tracking-wide">N° Comp.</th>
                <th className="px-4 py-3 text-xs font-bold text-texto-suave uppercase tracking-wide">Fecha</th>
                <th className="px-4 py-3 text-xs font-bold text-texto-suave uppercase tracking-wide">Cliente</th>
                <th className="px-4 py-3 text-xs font-bold text-texto-suave uppercase tracking-wide text-center">Ítems</th>
                <th className="px-4 py-3 text-xs font-bold text-texto-suave uppercase tracking-wide text-right">Total</th>
                <th className="px-4 py-3 text-xs font-bold text-texto-suave uppercase tracking-wide text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((v, i) => (
                <Fragment key={v.id}>
                  <tr
                    className={`border-b border-gray-50 hover:bg-blue-50/40 transition-colors cursor-pointer ${i % 2 === 0 ? '' : 'bg-gray-50/40'}`}
                    onClick={() => toggleExpandir(v.id)}
                  >
                    <td className="px-4 py-3 font-mono font-bold text-primario text-sm">{v.numero}</td>
                    <td className="px-4 py-3 text-sm text-texto-suave">{formatearFecha(v.fecha)}</td>
                    <td className="px-4 py-3 font-semibold text-texto">{v.razon_social}</td>
                    <td className="px-4 py-3 text-center text-sm text-texto-suave">{v.items.length}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-texto">
                      {formatearPrecio(v.total_final)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); setModalVenta(v) }}
                          className="p-2 rounded-xl hover:bg-blue-100 text-primario transition-colors"
                          title="Ver e imprimir comprobante"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleExpandir(v.id) }}
                          className="p-2 rounded-xl hover:bg-gray-100 text-texto-suave transition-colors"
                          title="Ver detalle"
                        >
                          {expandidos[v.id]
                            ? <ChevronUp className="w-4 h-4" />
                            : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Fila expandida con detalle de items */}
                  {expandidos[v.id] && (
                    <tr className="bg-blue-50/30">
                      <td colSpan={6} className="px-6 py-3">
                        <div className="rounded-xl overflow-hidden border border-blue-100 text-sm">
                          <table className="w-full">
                            <thead className="bg-blue-100/50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-bold text-texto-suave">Producto</th>
                                <th className="px-3 py-2 text-center text-xs font-bold text-texto-suave">Unid.</th>
                                <th className="px-3 py-2 text-center text-xs font-bold text-texto-suave">Kg</th>
                                <th className="px-3 py-2 text-right text-xs font-bold text-texto-suave">Precio</th>
                                <th className="px-3 py-2 text-right text-xs font-bold text-texto-suave">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {v.items.map((item, j) => (
                                <tr key={j} className={j % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                                  <td className="px-3 py-2 font-semibold text-texto">
                                    {item.denominacion}
                                  </td>
                                  <td className="px-3 py-2 text-center font-mono">{item.unidades || '—'}</td>
                                  <td className="px-3 py-2 text-center font-mono">
                                    {item.peso_kg > 0 ? `${item.peso_kg} kg` : '—'}
                                  </td>
                                  <td className="px-3 py-2 text-right font-mono">
                                    {formatearPrecio(item.precio_venta_neto)}
                                  </td>
                                  <td className="px-3 py-2 text-right font-mono font-bold text-primario">
                                    {formatearPrecio(item.precio_venta_neto * item.cantidad)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="flex justify-end gap-6 px-4 py-2 bg-gray-50 text-xs font-semibold text-texto-suave border-t border-gray-100">
                            <span className="text-base font-extrabold text-texto">
                              Total: <span className="font-mono">{formatearPrecio(v.total_neto)}</span>
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {modalVenta && (
          <ModalComprobante
            comprobante={modalVenta}
            onCerrar={() => setModalVenta(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
