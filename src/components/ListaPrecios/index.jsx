import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import * as XLSX from 'xlsx'
import { Plus, Upload, Download, Pencil, Trash2, X, Search, Package } from 'lucide-react'
import { formatearPrecio } from '../../lib/utils'
import { CATEGORIAS } from '../../lib/categorias'
import { parsearNumero, formatearKg } from '../../lib/pedido'

const UNIDADES = [
  { valor: 'unid', texto: 'Por unidad' },
  { valor: 'kg', texto: 'Por kilo' },
]

function ModalProducto({ producto, onGuardar, onCerrar }) {
  const [form, setForm] = useState({
    cod_articulo: producto?.cod_articulo ?? '',
    denominacion: producto?.denominacion ?? '',
    marca: producto?.marca ?? '',
    unidad_medida: producto?.unidad_medida ?? 'unid',
    precio_neto: producto?.precio_neto ?? '',
    peso_promedio_kg: producto?.peso_promedio_kg ?? '',
    stock: producto?.stock ?? '',
    categoria: producto?.categoria ?? 'Quesos',
  })
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)

  const handleChange = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    if (errores[campo]) setErrores((prev) => ({ ...prev, [campo]: null }))
  }

  const validar = () => {
    const e = {}
    if (!form.cod_articulo.trim()) e.cod_articulo = 'Requerido'
    if (!form.denominacion.trim()) e.denominacion = 'Requerido'
    const costo = parsearNumero(form.precio_neto)
    if (costo === null || costo <= 0) e.precio_neto = 'Ingresá el costo'
    if (form.peso_promedio_kg !== '' && form.peso_promedio_kg !== null && !(parsearNumero(form.peso_promedio_kg) > 0)) {
      e.peso_promedio_kg = 'Ingresá un peso válido (ej: 4,5)'
    }
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validar()) return
    setGuardando(true)
    const errorServidor = await onGuardar({
      ...form,
      precio_neto: parsearNumero(form.precio_neto),
      peso_promedio_kg: form.unidad_medida === 'kg' ? parsearNumero(form.peso_promedio_kg) : null,
      stock: parsearNumero(form.stock),
    })
    setGuardando(false)
    if (errorServidor) setErrores({ cod_articulo: errorServidor })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]"
      >
        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-xl font-extrabold text-texto">
            {producto ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button onClick={onCerrar} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-texto-suave" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-texto-suave mb-1">Código *</label>
              <input
                value={form.cod_articulo}
                onChange={(e) => handleChange('cod_articulo', e.target.value)}
                placeholder="Q001"
                className={`w-full border rounded-xl px-3 py-2.5 text-base font-mono focus:outline-none focus:ring-2 focus:ring-primario ${errores.cod_articulo ? 'border-peligro bg-red-50' : 'border-gray-200'}`}
              />
              {errores.cod_articulo && <p className="text-peligro text-xs mt-1">{errores.cod_articulo}</p>}
            </div>
            <div>
              <label className="block text-sm font-bold text-texto-suave mb-1">Se vende</label>
              <select
                value={form.unidad_medida}
                onChange={(e) => handleChange('unidad_medida', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-primario"
              >
                {UNIDADES.map((u) => <option key={u.valor} value={u.valor}>{u.texto}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-texto-suave mb-1">Denominación *</label>
            <input
              value={form.denominacion}
              onChange={(e) => handleChange('denominacion', e.target.value)}
              placeholder="Queso Cremoso x kg"
              className={`w-full border rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-primario ${errores.denominacion ? 'border-peligro bg-red-50' : 'border-gray-200'}`}
            />
            {errores.denominacion && <p className="text-peligro text-xs mt-1">{errores.denominacion}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-texto-suave mb-1">Marca</label>
            <input
              value={form.marca}
              onChange={(e) => handleChange('marca', e.target.value)}
              placeholder="La Serenísima"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-primario"
            />
          </div>

          {form.unidad_medida === 'kg' && (
            <div>
              <label className="block text-sm font-bold text-texto-suave mb-1">Peso promedio por pieza (kg)</label>
              <input
                inputMode="decimal"
                value={form.peso_promedio_kg ?? ''}
                onChange={(e) => handleChange('peso_promedio_kg', e.target.value)}
                placeholder="Ej: 4,5 (vacío si se vende suelto)"
                className={`w-full border rounded-xl px-3 py-2.5 text-base font-mono focus:outline-none focus:ring-2 focus:ring-primario ${errores.peso_promedio_kg ? 'border-peligro bg-red-50' : 'border-gray-200'}`}
              />
              {errores.peso_promedio_kg
                ? <p className="text-peligro text-xs mt-1">{errores.peso_promedio_kg}</p>
                : <p className="text-texto-suave text-xs mt-1">Si lo cargás, al pedir piezas los kilos se calculan solos (10 piezas × 4,5 = 45 kg).</p>}
            </div>
          )}

          {producto ? (
            <div className="bg-fondo rounded-xl px-4 py-3 text-sm text-texto-suave">
              Stock actual: <b className="font-mono text-texto">{Number(producto.stock ?? 0).toLocaleString('es-AR')}{form.unidad_medida === 'kg' ? ' kg' : ' u'}</b>.
              Para cambiarlo usá la sección <b>Stock</b> (ingresar mercadería o ajustar).
            </div>
          ) : (
            <div>
              <label className="block text-sm font-bold text-texto-suave mb-1">
                Stock inicial <span className="font-normal">({form.unidad_medida === 'kg' ? 'en kg' : 'en unidades'})</span>
              </label>
              <input
                inputMode="decimal"
                value={form.stock ?? ''}
                onChange={(e) => handleChange('stock', e.target.value)}
                placeholder="0"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-base font-mono focus:outline-none focus:ring-2 focus:ring-primario"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-texto-suave mb-1">
              Costo * <span className="font-normal">({form.unidad_medida === 'kg' ? 'por kilo' : 'por unidad'})</span>
            </label>
            <input
              inputMode="decimal"
              value={form.precio_neto}
              onChange={(e) => handleChange('precio_neto', e.target.value)}
              placeholder="4000"
              className={`w-full border rounded-xl px-3 py-2.5 text-base font-mono focus:outline-none focus:ring-2 focus:ring-primario ${errores.precio_neto ? 'border-peligro bg-red-50' : 'border-gray-200'}`}
            />
            {errores.precio_neto && <p className="text-peligro text-xs mt-1">{errores.precio_neto}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-texto-suave mb-1">Categoría</label>
            <select
              value={form.categoria}
              onChange={(e) => handleChange('categoria', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-primario"
            >
              {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCerrar}
              className="flex-1 py-3 border-2 border-gray-200 rounded-2xl text-base font-bold hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 py-3 bg-primario text-white rounded-2xl text-base font-bold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {guardando && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

function ModalConfirmarEliminar({ producto, onConfirmar, onCerrar }) {
  const [eliminando, setEliminando] = useState(false)

  const handleConfirmar = async () => {
    setEliminando(true)
    await onConfirmar()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <Trash2 className="w-8 h-8 text-peligro" />
        </div>
        <h3 className="text-xl font-bold text-texto mb-2">¿Eliminar producto?</h3>
        <p className="text-texto-suave mb-6 font-semibold">{producto.denominacion}</p>
        <div className="flex gap-3">
          <button
            onClick={onCerrar}
            className="flex-1 py-3 border-2 border-gray-200 rounded-2xl font-bold hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={eliminando}
            className="flex-1 py-3 bg-peligro text-white rounded-2xl font-bold hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {eliminando && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {eliminando ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function ListaPrecios() {
  const [precios, setPrecios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [importando, setImportando] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [productoEditando, setProductoEditando] = useState(null)
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(null)
  const importRef = useRef()

  const cargar = async () => {
    setCargando(true)
    const data = await window.api.productos.listar()
    setPrecios(data)
    setCargando(false)
  }

  useEffect(() => { cargar() }, [])

  const normalizar = (s) =>
    String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

  const filtrados = precios.filter((p) => {
    const q = normalizar(busqueda)
    return (
      normalizar(p.denominacion).includes(q) ||
      normalizar(p.cod_articulo).includes(q) ||
      normalizar(p.marca).includes(q) ||
      normalizar(p.categoria).includes(q)
    )
  })

  const handleGuardar = async (datos) => {
    const r = productoEditando
      ? await window.api.productos.actualizar(productoEditando.id, datos)
      : await window.api.productos.crear(datos)
    if (r?.ok === false) return r.error
    setModalAbierto(false)
    setProductoEditando(null)
    cargar()
  }

  const handleEliminar = async () => {
    await window.api.productos.eliminar(confirmandoEliminar.id)
    setConfirmandoEliminar(null)
    cargar()
  }

  const handleExportar = () => {
    const datos = precios.map((p) => ({
      'Código': p.cod_articulo,
      'Denominación': p.denominacion,
      'Marca': p.marca || '',
      'Unidad': p.unidad_medida,
      'Peso promedio': p.peso_promedio_kg ?? '',
      'Costo': p.precio_neto,
      'Stock': p.stock ?? '',
      'Categoría': p.categoria || '',
    }))
    const ws = XLSX.utils.json_to_sheet(datos)
    ws['!cols'] = [{ wch: 10 }, { wch: 35 }, { wch: 18 }, { wch: 8 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 14 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Precios')
    XLSX.writeFile(wb, 'lista_precios.xlsx')
  }

  const handleImportar = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImportando(true)
    const reader = new FileReader()
    reader.onload = async (evt) => {
      const wb = XLSX.read(evt.target.result, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const filas = XLSX.utils.sheet_to_json(ws)
      const resultado = await window.api.productos.importar(filas)
      const sinCosto = resultado.sinCosto || []
      setMensaje(
        `Se importaron ${resultado.importados} productos (${resultado.nuevos ?? 0} nuevos). El stock de los que ya existían no se modifica.` +
        (sinCosto.length
          ? ` ATENCIÓN: ${sinCosto.length} quedaron sin costo (${sinCosto.slice(0, 3).join(', ')}${sinCosto.length > 3 ? '…' : ''}). Revisá que el Excel tenga la columna "Costo".`
          : '')
      )
      cargar()
      setImportando(false)
      e.target.value = ''
    }
    reader.readAsArrayBuffer(file)
  }

  return (
    <div className="h-full flex flex-col p-6 bg-fondo">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-texto">Lista de Precios</h1>
          <p className="text-texto-suave mt-0.5">
            {precios.length} productos
            {precios.some((p) => !(p.precio_neto > 0)) && (
              <span className="text-peligro font-bold"> · {precios.filter((p) => !(p.precio_neto > 0)).length} sin costo</span>
            )}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportar} />
          <button
            onClick={() => importRef.current.click()}
            disabled={importando}
            className="flex items-center gap-2 px-4 py-3 border-2 border-gray-200 bg-white rounded-2xl font-bold hover:bg-gray-50 transition-colors text-sm disabled:opacity-60"
          >
            {importando
              ? <div className="w-4 h-4 border-2 border-primario border-t-transparent rounded-full animate-spin" />
              : <Upload className="w-4 h-4" />}
            {importando ? 'Importando...' : 'Importar Excel'}
          </button>
          <button
            onClick={handleExportar}
            className="flex items-center gap-2 px-4 py-3 border-2 border-gray-200 bg-white rounded-2xl font-bold hover:bg-gray-50 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Exportar Excel
          </button>
          <button
            onClick={() => { setProductoEditando(null); setModalAbierto(true) }}
            className="flex items-center gap-2 px-4 py-3 bg-primario text-white rounded-2xl font-bold hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Nuevo producto
          </button>
        </div>
      </div>

      {mensaje && (
        <div className="mb-4 flex items-center justify-between bg-green-50 text-secundario font-bold rounded-2xl px-4 py-3">
          <span>✓ {mensaje}</span>
          <button onClick={() => setMensaje(null)} className="p-1"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Búsqueda */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-texto-suave pointer-events-none" />
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, código o categoría..."
          className="w-full pl-12 pr-4 py-3 text-base rounded-2xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primario"
        />
      </div>

      {/* Tabla */}
      <div className="flex-1 overflow-auto bg-white rounded-2xl shadow-sm border border-gray-100">
        {cargando ? (
          <div className="flex items-center justify-center h-48 text-texto-suave text-lg">Cargando...</div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-texto-suave gap-3">
            <Package className="w-12 h-12 opacity-30" />
            <p className="text-lg font-semibold">
              {busqueda ? 'Sin resultados para la búsqueda' : 'No hay productos. Agregue uno o importe un Excel.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-fondo border-b border-gray-100 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-xs font-bold text-texto-suave uppercase tracking-wide">Código</th>
                <th className="px-4 py-3 text-xs font-bold text-texto-suave uppercase tracking-wide">Denominación</th>
                <th className="px-4 py-3 text-xs font-bold text-texto-suave uppercase tracking-wide">Marca</th>
                <th className="px-4 py-3 text-xs font-bold text-texto-suave uppercase tracking-wide">Se vende</th>
                <th className="px-4 py-3 text-xs font-bold text-texto-suave uppercase tracking-wide text-center">Peso prom.</th>
                <th className="px-4 py-3 text-xs font-bold text-texto-suave uppercase tracking-wide text-right">Costo</th>
                <th className="px-4 py-3 text-xs font-bold text-texto-suave uppercase tracking-wide text-center">Stock</th>
                <th className="px-4 py-3 text-xs font-bold text-texto-suave uppercase tracking-wide">Categoría</th>
                <th className="px-4 py-3 text-xs font-bold text-texto-suave uppercase tracking-wide text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p, i) => (
                <tr
                  key={p.id ?? p.cod_articulo}
                  className={`border-b border-gray-50 hover:bg-blue-50/40 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/40'}`}
                >
                  <td className="px-4 py-3 font-mono text-sm text-texto-suave">{p.cod_articulo}</td>
                  <td className="px-4 py-3 font-semibold text-texto">{p.denominacion}</td>
                  <td className="px-4 py-3 text-sm text-texto-suave">{p.marca || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${p.unidad_medida === 'kg' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {p.unidad_medida === 'kg' ? 'x kg' : 'x unidad'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-sm text-texto-suave">
                    {p.peso_promedio_kg ? formatearKg(p.peso_promedio_kg) : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-right font-bold text-primario">
                    {p.precio_neto > 0 ? (
                      <>{formatearPrecio(p.precio_neto)}<span className="text-xs text-texto-suave">{p.unidad_medida === 'kg' ? '/kg' : '/u'}</span></>
                    ) : (
                      <span className="text-peligro">Sin costo</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-sm text-texto">{p.stock != null ? Number(p.stock).toLocaleString('es-AR', { maximumFractionDigits: 3 }) : '—'}</td>
                  <td className="px-4 py-3 text-sm text-texto-suave">{p.categoria}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={() => { setProductoEditando(p); setModalAbierto(true) }}
                        className="p-2 rounded-xl hover:bg-blue-100 text-primario transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmandoEliminar(p)}
                        className="p-2 rounded-xl hover:bg-red-100 text-peligro transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {modalAbierto && (
          <ModalProducto
            producto={productoEditando}
            onGuardar={handleGuardar}
            onCerrar={() => { setModalAbierto(false); setProductoEditando(null) }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmandoEliminar && (
          <ModalConfirmarEliminar
            producto={confirmandoEliminar}
            onConfirmar={handleEliminar}
            onCerrar={() => setConfirmandoEliminar(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
