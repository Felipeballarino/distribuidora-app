import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import * as XLSX from 'xlsx'
import { Plus, Upload, Download, Pencil, Trash2, X, Search, Users } from 'lucide-react'

const CONDICIONES = ['Contado', '15 días', '30 días', '60 días', '90 días']

function ModalCliente({ cliente, onGuardar, onCerrar }) {
  const [form, setForm] = useState({
    cod_cliente: cliente?.cod_cliente ?? '',
    razon_social: cliente?.razon_social ?? '',
    domicilio: cliente?.domicilio ?? '',
    condicion_venta: cliente?.condicion_venta ?? 'Contado',
    cuit: cliente?.cuit ?? '',
  })
  const [errores, setErrores] = useState({})

  const handleChange = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    if (errores[campo]) setErrores((prev) => ({ ...prev, [campo]: null }))
  }

  const validar = () => {
    const e = {}
    if (!form.cod_cliente.trim()) e.cod_cliente = 'Requerido'
    if (!form.razon_social.trim()) e.razon_social = 'Requerido'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validar()) return
    onGuardar(form)
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
            {cliente ? 'Editar Cliente' : 'Nuevo Cliente'}
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
                value={form.cod_cliente}
                onChange={(e) => handleChange('cod_cliente', e.target.value)}
                placeholder="001"
                className={`w-full border rounded-xl px-3 py-2.5 text-base font-mono focus:outline-none focus:ring-2 focus:ring-primario ${errores.cod_cliente ? 'border-peligro bg-red-50' : 'border-gray-200'}`}
              />
              {errores.cod_cliente && <p className="text-peligro text-xs mt-1">{errores.cod_cliente}</p>}
            </div>
            <div>
              <label className="block text-sm font-bold text-texto-suave mb-1">Condición de Venta</label>
              <select
                value={form.condicion_venta}
                onChange={(e) => handleChange('condicion_venta', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-primario"
              >
                {CONDICIONES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-texto-suave mb-1">Razón Social *</label>
            <input
              value={form.razon_social}
              onChange={(e) => handleChange('razon_social', e.target.value)}
              placeholder="Supermercado El Ahorro"
              className={`w-full border rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-primario ${errores.razon_social ? 'border-peligro bg-red-50' : 'border-gray-200'}`}
            />
            {errores.razon_social && <p className="text-peligro text-xs mt-1">{errores.razon_social}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-texto-suave mb-1">Domicilio</label>
            <input
              value={form.domicilio}
              onChange={(e) => handleChange('domicilio', e.target.value)}
              placeholder="Av. San Martín 1234"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-primario"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-texto-suave mb-1">CUIT</label>
            <input
              value={form.cuit}
              onChange={(e) => handleChange('cuit', e.target.value)}
              placeholder="30-12345678-9"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-base font-mono focus:outline-none focus:ring-2 focus:ring-primario"
            />
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

function ModalConfirmarEliminar({ cliente, onConfirmar, onCerrar }) {
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
        <h3 className="text-xl font-bold text-texto mb-2">¿Eliminar cliente?</h3>
        <p className="text-texto-suave mb-6 font-semibold">{cliente.razon_social}</p>
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

const BADGE_CONDICION = {
  'Contado': 'bg-green-100 text-green-700',
  '15 días': 'bg-yellow-100 text-yellow-700',
  '30 días': 'bg-orange-100 text-orange-700',
  '60 días': 'bg-red-100 text-red-700',
  '90 días': 'bg-red-100 text-red-700',
}

export default function ListaClientes() {
  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [clienteEditando, setClienteEditando] = useState(null)
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(null)
  const importRef = useRef()

  const cargar = async () => {
    setCargando(true)
    const data = await window.api.clientes.listar()
    setClientes(data)
    setCargando(false)
  }

  useEffect(() => { cargar() }, [])

  const filtrados = clientes.filter((c) => {
    const q = busqueda.toLowerCase()
    return (
      c.razon_social.toLowerCase().includes(q) ||
      c.cod_cliente.toLowerCase().includes(q) ||
      (c.domicilio || '').toLowerCase().includes(q) ||
      (c.cuit || '').includes(q)
    )
  })

  const handleGuardar = async (datos) => {
    if (clienteEditando) {
      await window.api.clientes.actualizar(clienteEditando.id, datos)
    } else {
      await window.api.clientes.crear(datos)
    }
    setModalAbierto(false)
    setClienteEditando(null)
    cargar()
  }

  const handleEliminar = async () => {
    await window.api.clientes.eliminar(confirmandoEliminar.id)
    setConfirmandoEliminar(null)
    cargar()
  }

  const handleExportar = () => {
    const datos = clientes.map((c) => ({
      'Código': c.cod_cliente,
      'Razón Social': c.razon_social,
      'Domicilio': c.domicilio || '',
      'Condición de Venta': c.condicion_venta || 'Contado',
      'CUIT': c.cuit || '',
    }))
    const ws = XLSX.utils.json_to_sheet(datos)
    ws['!cols'] = [{ wch: 8 }, { wch: 35 }, { wch: 30 }, { wch: 20 }, { wch: 16 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes')
    XLSX.writeFile(wb, 'lista_clientes.xlsx')
  }

  const handleImportar = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (evt) => {
      const wb = XLSX.read(evt.target.result, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const filas = XLSX.utils.sheet_to_json(ws)
      const resultado = await window.api.clientes.importar(filas)
      alert(`✓ Se importaron ${resultado.importados} clientes correctamente.`)
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
          <h1 className="text-2xl font-extrabold text-texto">Lista de Clientes</h1>
          <p className="text-texto-suave mt-0.5">{clientes.length} clientes · Columnas Excel: Código, Razón Social, Domicilio, Condición de Venta, CUIT</p>
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
            onClick={() => { setClienteEditando(null); setModalAbierto(true) }}
            className="flex items-center gap-2 px-4 py-3 bg-primario text-white rounded-2xl font-bold hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Nuevo cliente
          </button>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-texto-suave pointer-events-none" />
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, código, domicilio o CUIT..."
          className="w-full pl-12 pr-4 py-3 text-base rounded-2xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primario"
        />
      </div>

      {/* Tabla */}
      <div className="flex-1 overflow-auto bg-white rounded-2xl shadow-sm border border-gray-100">
        {cargando ? (
          <div className="flex items-center justify-center h-48 text-texto-suave text-lg">Cargando...</div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-texto-suave gap-3">
            <Users className="w-12 h-12 opacity-30" />
            <p className="text-lg font-semibold">
              {busqueda ? 'Sin resultados para la búsqueda' : 'No hay clientes. Agregue uno o importe un Excel.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-fondo border-b border-gray-100 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-xs font-bold text-texto-suave uppercase tracking-wide">Código</th>
                <th className="px-4 py-3 text-xs font-bold text-texto-suave uppercase tracking-wide">Razón Social</th>
                <th className="px-4 py-3 text-xs font-bold text-texto-suave uppercase tracking-wide">Domicilio</th>
                <th className="px-4 py-3 text-xs font-bold text-texto-suave uppercase tracking-wide">Cond. Venta</th>
                <th className="px-4 py-3 text-xs font-bold text-texto-suave uppercase tracking-wide">CUIT</th>
                <th className="px-4 py-3 text-xs font-bold text-texto-suave uppercase tracking-wide text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c, i) => (
                <tr
                  key={c.id ?? c.cod_cliente}
                  className={`border-b border-gray-50 hover:bg-blue-50/40 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/40'}`}
                >
                  <td className="px-4 py-3 font-mono text-sm text-texto-suave">{c.cod_cliente}</td>
                  <td className="px-4 py-3 font-semibold text-texto">{c.razon_social}</td>
                  <td className="px-4 py-3 text-sm text-texto-suave">{c.domicilio}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${BADGE_CONDICION[c.condicion_venta] || 'bg-gray-100 text-gray-600'}`}>
                      {c.condicion_venta}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-texto-suave">{c.cuit}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={() => { setClienteEditando(c); setModalAbierto(true) }}
                        className="p-2 rounded-xl hover:bg-blue-100 text-primario transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmandoEliminar(c)}
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
          <ModalCliente
            cliente={clienteEditando}
            onGuardar={handleGuardar}
            onCerrar={() => { setModalAbierto(false); setClienteEditando(null) }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmandoEliminar && (
          <ModalConfirmarEliminar
            cliente={confirmandoEliminar}
            onConfirmar={handleEliminar}
            onCerrar={() => setConfirmandoEliminar(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
