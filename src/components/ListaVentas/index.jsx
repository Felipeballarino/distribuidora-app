import { useState, useEffect, useRef, Fragment } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, FileText, Printer, X, ChevronDown, ChevronUp } from 'lucide-react'
import { formatearPrecio, formatearFecha } from '../../lib/utils'

function ModalComprobante({ comprobante, onCerrar }) {
  const printRef = useRef()

  const handleImprimir = () => {
    const contenido = printRef.current.innerHTML
    const ventana = window.open('', '_blank')
    ventana.document.write(`
      <html>
        <head>
          <title>Comprobante N° ${comprobante.numero}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; font-size: 13px; color: #111827; padding: 20px; }
            h1 { font-size: 20px; font-weight: 900; margin-bottom: 4px; }
            .sub { color: #6b7280; font-size: 12px; }
            .section { margin: 16px 0; }
            .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
            .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #f9fafb; padding: 12px; border-radius: 8px; }
            .label { font-size: 10px; color: #6b7280; font-weight: 700; margin-bottom: 2px; }
            .value { font-size: 13px; font-weight: 600; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #f9fafb; padding: 6px 10px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #6b7280; }
            td { padding: 7px 10px; font-size: 12px; border-bottom: 1px solid #f3f4f6; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-mono { font-family: 'Courier New', monospace; }
            .font-bold { font-weight: 700; }
            .totales { background: #f9fafb; padding: 12px 16px; border-radius: 8px; }
            .total-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 13px; }
            .total-final { font-size: 18px; font-weight: 900; border-top: 2px solid #e5e7eb; padding-top: 8px; margin-top: 4px; }
            .badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1a56db; padding-bottom: 12px; margin-bottom: 16px; }
            .empresa { font-size: 16px; font-weight: 900; color: #1a56db; }
            .comp-num { font-family: 'Courier New', monospace; font-size: 20px; font-weight: 900; color: #1a56db; }
          </style>
        </head>
        <body>
          ${contenido}
        </body>
      </html>
    `)
    ventana.document.close()
    ventana.focus()
    ventana.print()
    ventana.close()
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
              className="flex items-center gap-2 px-4 py-2.5 bg-primario text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimir
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
        <div className="overflow-y-auto flex-1 p-6">
          {/* Contenido a imprimir */}
          <div ref={printRef}>
            {/* Header imprimible */}
            <div className="header">
              <div>
                <div className="empresa">Distribuidora</div>
                <div className="sub">{formatearFecha(comprobante.fecha)}</div>
              </div>
              <div className="text-right">
                <div className="sub">Comprobante N°</div>
                <div className="comp-num">{comprobante.numero}</div>
              </div>
            </div>

            {/* Cliente */}
            <div className="section">
              <div className="section-title">Datos del cliente</div>
              <div className="grid2">
                <div>
                  <div className="label">Razón Social</div>
                  <div className="value">{comprobante.razon_social}</div>
                </div>
                <div>
                  <div className="label">Código</div>
                  <div className="value font-mono">{comprobante.cod_cliente}</div>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="section">
              <div className="section-title">
                Detalle — {comprobante.items.length} {comprobante.items.length === 1 ? 'producto' : 'productos'}
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className="text-center">Unidades</th>
                    <th className="text-center">Kg</th>
                    <th className="text-right">Precio c/IVA</th>
                    <th className="text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {comprobante.items.map((item, i) => {
                    const subtotal = item.precio_venta_con_iva * item.cantidad
                    return (
                      <tr key={i}>
                        <td>
                          <span className="font-bold">{item.denominacion}</span>
                          {item.markup_pct > 0 && (
                            <span className="badge ml-2">+{item.markup_pct}%</span>
                          )}
                        </td>
                        <td className="text-center font-mono">{item.unidades || '—'}</td>
                        <td className="text-center font-mono">
                          {item.peso_kg > 0 ? `${item.peso_kg} kg` : '—'}
                        </td>
                        <td className="text-right font-mono">
                          {formatearPrecio(item.precio_venta_con_iva)}
                        </td>
                        <td className="text-right font-mono font-bold">
                          {formatearPrecio(subtotal)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Totales */}
            <div className="totales">
              <div className="total-row">
                <span>Neto gravado</span>
                <span className="font-mono">{formatearPrecio(totales.neto)}</span>
              </div>
              <div className="total-row">
                <span>IVA 21%</span>
                <span className="font-mono">{formatearPrecio(totales.iva)}</span>
              </div>
              <div className="total-row total-final">
                <span>Total</span>
                <span className="font-mono">{formatearPrecio(totales.total)}</span>
              </div>
            </div>
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
                                <th className="px-3 py-2 text-right text-xs font-bold text-texto-suave">Precio c/IVA</th>
                                <th className="px-3 py-2 text-right text-xs font-bold text-texto-suave">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {v.items.map((item, j) => (
                                <tr key={j} className={j % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                                  <td className="px-3 py-2 font-semibold text-texto">
                                    {item.denominacion}
                                    {item.markup_pct > 0 && (
                                      <span className="ml-1 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">
                                        +{item.markup_pct}%
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-center font-mono">{item.unidades || '—'}</td>
                                  <td className="px-3 py-2 text-center font-mono">
                                    {item.peso_kg > 0 ? `${item.peso_kg} kg` : '—'}
                                  </td>
                                  <td className="px-3 py-2 text-right font-mono">
                                    {formatearPrecio(item.precio_venta_con_iva)}
                                  </td>
                                  <td className="px-3 py-2 text-right font-mono font-bold text-primario">
                                    {formatearPrecio(item.precio_venta_con_iva * item.cantidad)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="flex justify-end gap-6 px-4 py-2 bg-gray-50 text-xs font-semibold text-texto-suave border-t border-gray-100">
                            <span>Neto: <span className="font-mono text-texto">{formatearPrecio(v.total_neto)}</span></span>
                            <span>IVA 21%: <span className="font-mono text-texto">{formatearPrecio(v.total_iva)}</span></span>
                            <span className="text-base font-extrabold text-texto">
                              Total: <span className="font-mono">{formatearPrecio(v.total_final)}</span>
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
