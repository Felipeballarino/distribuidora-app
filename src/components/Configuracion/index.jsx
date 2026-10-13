import { useState, useEffect } from 'react'
import { Save, Building2 } from 'lucide-react'
import { getEmpresa, setEmpresa } from '../../lib/empresa'

export default function Configuracion() {
  const [form, setForm] = useState({
    nombre: '',
    razon_social: '',
    cuit: '',
    ubicacion: '',
  })
  const [guardado, setGuardado] = useState(false)

  useEffect(() => {
    const datos = getEmpresa()
    if (Object.keys(datos).length > 0) setForm((prev) => ({ ...prev, ...datos }))
  }, [])

  const handleChange = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    setGuardado(false)
  }

  const handleGuardar = (e) => {
    e.preventDefault()
    setEmpresa(form)
    setGuardado(true)
  }

  return (
    <div className="h-full flex flex-col p-6 bg-fondo">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-texto">Configuración</h1>
        <p className="text-texto-suave mt-0.5">Datos de la distribuidora — aparecen en los remitos</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-50 rounded-xl p-2.5">
            <Building2 className="w-6 h-6 text-primario" />
          </div>
          <h2 className="text-lg font-extrabold text-texto">Datos de la empresa</h2>
        </div>

        <form onSubmit={handleGuardar} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-texto-suave mb-1">Nombre comercial</label>
            <input
              value={form.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder="Distribuidora Rojas"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primario"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-texto-suave mb-1">Razón Social</label>
            <input
              value={form.razon_social}
              onChange={(e) => handleChange('razon_social', e.target.value)}
              placeholder="Roberto Rojas"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primario"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-texto-suave mb-1">CUIT</label>
            <input
              value={form.cuit}
              onChange={(e) => handleChange('cuit', e.target.value)}
              placeholder="20-12345678-9"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base font-mono focus:outline-none focus:ring-2 focus:ring-primario"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-texto-suave mb-1">Ubicación</label>
            <input
              value={form.ubicacion}
              onChange={(e) => handleChange('ubicacion', e.target.value)}
              placeholder="Lolog N° 1026 — Villa María, Córdoba"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primario"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-primario text-white rounded-2xl text-base font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mt-2"
          >
            <Save className="w-5 h-5" />
            {guardado ? '✓ Guardado' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  )
}
