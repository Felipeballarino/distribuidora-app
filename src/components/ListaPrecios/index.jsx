import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import * as XLSX from 'xlsx'
import { Plus, Upload, Download, Pencil, Trash2, X, Search, Package } from 'lucide-react'
import { formatearPrecio } from '../../lib/utils'

const CATEGORIAS = ['Quesos', 'Manteca', 'Yogures', 'Leche', 'Cremas', 'Otros']
const UNIDADES = ['unid', 'kg']
const IVA = 0.21

function ModalProducto({ producto, onGuardar, onCerrar }) {
  const [form, setForm] = useState({
    cod_articulo: producto?.cod_articulo ?? '',
    denominacion: producto?.denominacion ?? '',
    unidad_medida: producto?.unidad_medida ?? 'unid',
    precio_neto: producto?.precio_neto ?? '',
    precio_con_iva: producto?.precio_con_iva ?? '',
    categoria: producto?.categoria ?? 'Quesos',
  })
  const [errores, setErrores] = useState({})

  const handleChange = (campo, valor) => {
    setForm((prev) => {
      const next = { ...prev, [campo]: valor }
      if (campo === 'precio_neto') {
        const n = parseFloat(valor)
        if (!isNaN(n)) next.precio_con_iva = (n * (1 + IVA)).toFixed(2)
      }
      return next
    })
    if (errores[campo]) setErrores((prev) => ({ ...prev, [campo]: null }))
  }

  const validar = () => {
    const e = {}
    if (!form.cod_articulo.trim()) e.cod_articulo = 'Requerido'
    if (!form.denominacion.trim()) e.denominacion = 'Requerido'
    if (!form.precio_neto || isNaN(parseFloat(form.precio_neto))) e.precio_neto = 'Ingresá un número'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validar()) return
    onGuardar({
      ...form,
      precio_neto: parseFloat(form.precio_neto),
      precio_con_iva: parseFloat(form.precio_con_iva) || parseFloat(form.precio_neto) * (1 + IVA),
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
      >
        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
          <h2 className="text-xl font-extrabold text-texto">
            {producto ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button onClick={onCerrar} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-texto-suave" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              <label className="block text-sm font-bold text-texto-suave mb-1">Unidad</label>
              <select
                value={form.unidad_medida}
                onChange={(e) => handleChange('unidad_medida', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-primario"
              >
                {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-texto-suave mb-1">Precio Neto *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.precio_neto}
                onChange={(e) => handleChange('precio_neto', e.target.value)}
                placeholder="1000.00"
                className={`w-full border rounded-xl px-3 py-2.5 text-base font-mono focus:outline-none focus:ring-2 focus:ring-primario ${errores.precio_neto ? 'border-peligro bg-red-50' : 'border-gray-200'}`}
              />
              {errores.precio_neto && <p className="text-peligro text-xs mt-1">{errores.precio_neto}</p>}
            </div>
            <div>
              <label className="block text-sm font-bold text-texto-suave mb-1">
                Precio c/IVA <span className="font-normal text-xs">(21% auto)</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.precio_con_iva}
                onChange={(e) => handleChange('precio_con_iva', e.target.value)}
                placeholder="1210.00"
                className="w-full border border-blue-200 bg-blue-50 rounded-xl px-3 py-2.5 text-base font-mono focus:outline-none focus:ring-2 focus:ring-primario"
              />
            </div>
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
              className="flex-1 py-3 bg-primario text-white rounded-2xl text-base font-bold hover:bg-blue-700 transition-colors"
            >
              Guardar
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

function ModalConfirmarEliminar({ producto, onConfirmar, onCerrar }) {
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
            onClick={onConfirmar}
            className="flex-1 py-3 bg-peligro text-white rounded-2xl font-bold hover:bg-red-700"
          >
            Eliminar
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function ListaPrecios() {
  const [precios, setPrecios] = useState([])
  const [cargando, setCargando] = useState(true)
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

  const filtrados = precios.filter((p) => {
    const q = busqueda.toLowerCase()
    return (
      p.denominacion.toLowerCase().includes(q) ||
      p.cod_articulo.toLowerCase().includes(q) ||
      (p.categoria || '').toLowerCase().includes(q)
    )
  })

  const handleGuardar = async (datos) => {
    if (productoEditando) {
      await window.api.productos.actualizar(productoEditando.id, datos)
    } else {
      await window.api.productos.crear(datos)
    }
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
      'Unidad': p.unidad_medida,
      'Precio Neto': p.precio_neto,
      'Precio c/IVA': p.precio_con_iva,
      'Categoría': p.categoria || '',
    }))
    const ws = XLSX.utils.json_to_sheet(datos)
    ws['!cols'] = [{ wch: 10 }, { wch: 35 }, { wch: 8 }, { wch: 14 }, { wch: 14 }, { wch: 14 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Precios')
    XLSX.writeFile(wb, 'lista_precios.xlsx')
  }

  const handleImportar = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (evt) => {
      const wb = XLSX.read(evt.target.result, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const filas = XLSX.utils.sheet_to_json(ws)
      const resultado = await window.api.productos.importar(filas)
      alert(`✓ Se importaron ${resultado.importados} productos correctamente.`)
      cargar()
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
          <p className="text-texto-suave mt-0.5">{precios.length} productos · Columnas Excel: Código, Denominación, Unidad, Precio Neto, Precio c/IVA, Categoría</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportar} />
          <button
            onClick={() => importRef.current.click()}
            className="flex items-center gap-2 px-4 py-3 border-2 border-gray-200 bg-white rounded-2xl font-bold hover:bg-gray-50 transition-colors text-sm"
          >
            <Upload className="w-4 h-4" />
            Importar Excel
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
                <th className="px-4 py-3 text-xs font-bold text-texto-suave uppercase tracking-wide">Unidad</th>
                <th className="px-4 py-3 text-xs font-bold text-texto-suave uppercase tracking-wide text-right">Precio Neto</th>
                <th className="px-4 py-3 text-xs font-bold text-texto-suave uppercase tracking-wide text-right">Precio c/IVA</th>
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
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${p.unidad_medida === 'kg' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {p.unidad_medida}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-right text-texto">{formatearPrecio(p.precio_neto)}</td>
                  <td className="px-4 py-3 font-mono text-right font-bold text-primario">{formatearPrecio(p.precio_con_iva)}</td>
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
