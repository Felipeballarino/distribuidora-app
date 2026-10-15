import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import * as XLSX from 'xlsx'
import { Plus, Upload, Download, Pencil, Trash2, X, Search, Users } from 'lucide-react'

function ModalCliente({ cliente, onGuardar, onCerrar }) {
  const [form, setForm] = useState({
    cod_cliente: cliente?.cod_cliente ?? '',
    razon_social: cliente?.razon_social ?? '',
    domicilio: cliente?.domicilio ?? '',
    localidad: cliente?.localidad ?? '',
    telefono: cliente?.telefono ?? '',
    email: cliente?.email ?? '',
    cuit: cliente?.cuit ?? '',
  })
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validar()) return
    setGuardando(true)
    await onGuardar(form)
    setGuardando(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]"
      >
        <div className="flex justify-between items-center px-6 py-5 border-b border-borde flex-shrink-0">
          <h2 className="text-xl font-extrabold text-texto">
            {cliente ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h2>
          <button onClick={onCerrar} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-texto-suave" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-bold text-texto-suave mb-1">Código *</label>
            <input
              value={form.cod_cliente}
              onChange={(e) => handleChange('cod_cliente', e.target.value)}
              placeholder="001"
              className={`w-full border rounded-xl px-3 py-2.5 text-base font-mono focus:outline-none focus:ring-2 focus:ring-primario ${errores.cod_cliente ? 'border-peligro bg-red-50' : 'border-borde'}`}
            />
            {errores.cod_cliente && <p className="text-peligro text-xs mt-1">{errores.cod_cliente}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-texto-suave mb-1">Razón Social *</label>
            <input
              value={form.razon_social}
              onChange={(e) => handleChange('razon_social', e.target.value)}
              placeholder="Supermercado El Ahorro"
              className={`w-full border rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-primario ${errores.razon_social ? 'border-peligro bg-red-50' : 'border-borde'}`}
            />
            {errores.razon_social && <p className="text-peligro text-xs mt-1">{errores.razon_social}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-texto-suave mb-1">Domicilio</label>
            <input
              value={form.domicilio}
              onChange={(e) => handleChange('domicilio', e.target.value)}
              placeholder="Av. San Martín 1234"
              className="w-full border border-borde rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-primario"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-texto-suave mb-1">Localidad</label>
            <input
              value={form.localidad}
              onChange={(e) => handleChange('localidad', e.target.value)}
              placeholder="Villa María"
              className="w-full border border-borde rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-primario"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-texto-suave mb-1">Teléfono</label>
              <input
                value={form.telefono}
                onChange={(e) => handleChange('telefono', e.target.value)}
                placeholder="2664123456"
                className="w-full border border-borde rounded-xl px-3 py-2.5 text-base font-mono focus:outline-none focus:ring-2 focus:ring-primario"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-texto-suave mb-1">CUIT</label>
              <input
                value={form.cuit}
                onChange={(e) => handleChange('cuit', e.target.value)}
                placeholder="30-12345678-9"
                className="w-full border border-borde rounded-xl px-3 py-2.5 text-base font-mono focus:outline-none focus:ring-2 focus:ring-primario"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-texto-suave mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="cliente@mail.com"
              className="w-full border border-borde rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-primario"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCerrar}
              className="flex-1 py-3 border-2 border-borde rounded-xl text-base font-bold hover:bg-fondo transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 py-3 bg-primario text-white rounded-xl text-base font-bold hover:bg-primario-oscuro transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
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

function ModalConfirmarEliminar({ cliente, onConfirmar, onCerrar }) {
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
        className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <Trash2 className="w-8 h-8 text-peligro" />
        </div>
        <h3 className="text-xl font-bold text-texto mb-2">¿Eliminar cliente?</h3>
        <p className="text-texto-suave mb-6 font-semibold">{cliente.razon_social}</p>
        <div className="flex gap-3">
          <button
            onClick={onCerrar}
            className="flex-1 py-3 border-2 border-borde rounded-xl font-bold hover:bg-fondo"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={eliminando}
            className="flex-1 py-3 bg-peligro text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {eliminando && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {eliminando ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// Parsea el formato de Tango (dos filas por cliente)
function parsearExcelTango(filas) {
  const clientes = []
  const codigos = new Set()

  for (let i = 0; i < filas.length; i++) {
    const fila = filas[i]
    if (fila[0] !== 'C') continue

    const razon = String(fila[4] || '').trim()
    if (!razon) continue

    // La fila extra solo existe si la siguiente fila tiene primera celda vacía/null
    let extra = []
    if (i + 1 < filas.length && !filas[i + 1][0]) {
      extra = filas[i + 1]
      i++ // saltar la fila extra
    }

    // El código interno está en la columna 17 de la fila extra
    const codInterno = String(extra[17] || '').trim()
    if (!codInterno || codigos.has(codInterno)) continue
    codigos.add(codInterno)

    const cuit = String(fila[7] || '').trim()
    // MaxFlex exporta "Calle  N° 275": se conserva el número ("Calle 275"); "N° 0" = sin número
    const domicilio = String(fila[9] || '')
      .replace(/\s+N°\s+0+$/, '')
      .replace(/\s+N°\s+(\d+)$/, ' $1')
      .replace(/\s+0$/, '')
      .replace(/\s+/g, ' ')
      .trim()
    const localidad = String(fila[13] || '').replace(/^\d+\s*-\s*/, '').trim()
    const telefono = String(extra[4] || '').trim()
    const email = String(extra[6] || '').trim()

    clientes.push({
      cod_cliente: codInterno,
      razon_social: razon,
      cuit: /^00-00000000-0$/.test(cuit) ? '' : cuit,
      domicilio: domicilio.startsWith('SIN ESPECIFICAR') ? '' : domicilio,
      localidad,
      telefono: telefono.length <= 1 ? '' : telefono,
      email,
    })
  }
  return clientes
}

export default function ListaClientes() {
  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [importando, setImportando] = useState(false)
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
      (c.localidad || '').toLowerCase().includes(q) ||
      (c.telefono || '').includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
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
      'Localidad': c.localidad || '',
      'Teléfono': c.telefono || '',
      'Email': c.email || '',
      'CUIT': c.cuit || '',
    }))
    const ws = XLSX.utils.json_to_sheet(datos)
    ws['!cols'] = [{ wch: 8 }, { wch: 35 }, { wch: 30 }, { wch: 20 }, { wch: 14 }, { wch: 28 }, { wch: 18 }, { wch: 16 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes')
    XLSX.writeFile(wb, 'lista_clientes.xlsx')
  }

  const handleImportar = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImportando(true)
    const reader = new FileReader()
    reader.onload = async (evt) => {
      const wb = XLSX.read(evt.target.result, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      // Intentar detectar formato Tango (filas crudas)
      const filasCrudas = XLSX.utils.sheet_to_json(ws, { header: 1 })
      const esTango = filasCrudas.some((f) => f[0] === 'C' || f[0] === 'P')

      let clientesParseados
      if (esTango) {
        clientesParseados = parsearExcelTango(filasCrudas)
      } else {
        const filasPlanas = XLSX.utils.sheet_to_json(ws)
        clientesParseados = filasPlanas.map((f) => ({
          cod_cliente: String(f['Código'] || f['Codigo'] || f.cod_cliente || '').trim(),
          razon_social: String(f['Razón Social'] || f['Razon Social'] || f.razon_social || '').trim(),
          domicilio: String(f['Domicilio'] || f.domicilio || '').trim(),
          localidad: String(f['Localidad'] || f.localidad || '').trim(),
          telefono: String(f['Teléfono'] || f['Telefono'] || f.telefono || '').trim(),
          email: String(f['Email'] || f.email || '').trim(),
          cuit: String(f['CUIT'] || f.cuit || '').trim(),
        })).filter((c) => c.cod_cliente && c.razon_social)
      }

      const validos = clientesParseados.filter((c) => c.cod_cliente && c.razon_social)
      const resultado = await window.api.clientes.importar(validos)
      alert(`✓ Se importaron ${resultado.importados} clientes correctamente.`)
      cargar()
      e.target.value = ''
      setImportando(false)
    }
    reader.readAsArrayBuffer(file)
  }

  return (
    <div className="h-full flex flex-col px-8 py-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-texto">Lista de Clientes</h1>
          <p className="text-texto-suave mt-0.5">{clientes.length} clientes</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportar} />
          <button
            onClick={() => importRef.current.click()}
            disabled={importando}
            className="flex items-center gap-2 px-4 py-3 border-2 border-borde bg-white rounded-xl font-bold hover:bg-fondo transition-colors text-sm disabled:opacity-60"
          >
            {importando
              ? <div className="w-4 h-4 border-2 border-primario border-t-transparent rounded-full animate-spin" />
              : <Upload className="w-4 h-4" />}
            {importando ? 'Importando...' : 'Importar Excel'}
          </button>
          <button
            onClick={handleExportar}
            className="flex items-center gap-2 px-4 py-3 border-2 border-borde bg-white rounded-xl font-bold hover:bg-fondo transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Exportar Excel
          </button>
          <button
            onClick={() => { setClienteEditando(null); setModalAbierto(true) }}
            className="flex items-center gap-2 px-4 py-3 bg-primario text-white rounded-xl font-bold hover:bg-primario-oscuro transition-colors text-sm"
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
          placeholder="Buscar por nombre, código, localidad, teléfono, email o CUIT..."
          className="w-full pl-12 pr-4 py-3 text-base rounded-xl border border-borde bg-white focus:outline-none focus:ring-2 focus:ring-primario"
        />
      </div>

      {/* Tabla */}
      <div className="flex-1 overflow-auto bg-white rounded-xl shadow-tarjeta border border-borde">
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
            <thead className="bg-fondo border-b border-borde sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-xs font-bold text-texto-suave uppercase tracking-wide">Código</th>
                <th className="px-4 py-3 text-xs font-bold text-texto-suave uppercase tracking-wide">Razón Social</th>
                <th className="px-4 py-3 text-xs font-bold text-texto-suave uppercase tracking-wide">Domicilio</th>
                <th className="px-4 py-3 text-xs font-bold text-texto-suave uppercase tracking-wide">Localidad</th>
                <th className="px-4 py-3 text-xs font-bold text-texto-suave uppercase tracking-wide">Teléfono</th>
                <th className="px-4 py-3 text-xs font-bold text-texto-suave uppercase tracking-wide">Email</th>
                <th className="px-4 py-3 text-xs font-bold text-texto-suave uppercase tracking-wide w-40">CUIT</th>
                <th className="px-4 py-3 text-xs font-bold text-texto-suave uppercase tracking-wide text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c, i) => (
                <tr
                  key={c.id ?? c.cod_cliente}
                  className={`border-b border-borde/60 hover:bg-blue-50/40 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/40'}`}
                >
                  <td className="px-4 py-3 font-mono text-sm text-texto-suave">{c.cod_cliente}</td>
                  <td className="px-4 py-3 font-semibold text-texto">{c.razon_social}</td>
                  <td className="px-4 py-3 text-sm text-texto-suave">{c.domicilio || '—'}</td>
                  <td className="px-4 py-3 text-sm text-texto-suave">{c.localidad || '—'}</td>
                  <td className="px-4 py-3 font-mono text-sm text-texto-suave">{c.telefono || '—'}</td>
                  <td className="px-4 py-3 text-sm text-texto-suave">{c.email || '—'}</td>
                  <td className="px-4 py-3 font-mono text-sm text-texto-suave whitespace-nowrap">{c.cuit || '—'}</td>
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
