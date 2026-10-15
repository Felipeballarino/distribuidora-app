import { useState, useEffect } from 'react'
import { Save, Building2, Warehouse } from 'lucide-react'
import usePedidoStore from '../../store/pedidoStore'
import { getEmpresa, setEmpresa } from '../../lib/empresa'

// Interruptor: bloquear (o no) las ventas de lo que no hay en stock
function OpcionesStock() {
  const bloquear = usePedidoStore((s) => s.bloquearSinStock)
  const setBloquear = usePedidoStore((s) => s.setBloquearSinStock)
  const [guardando, setGuardando] = useState(false)

  const cambiar = async () => {
    setGuardando(true)
    const r = await window.api.config.guardar({ bloquear_sin_stock: !bloquear })
    if (r?.ok) setBloquear(r.config.bloquear_sin_stock)
    setGuardando(false)
  }

  return (
    <div className="bg-white rounded-xl shadow-tarjeta border border-borde p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-primario-suave rounded-lg p-2"><Warehouse className="w-5 h-5 text-primario" /></div>
        <h2 className="text-lg font-extrabold text-texto">Stock</h2>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={bloquear}
        onClick={cambiar}
        disabled={guardando}
        className="w-full flex items-start gap-4 text-left disabled:opacity-60"
      >
        <span className={`mt-0.5 shrink-0 w-12 h-7 rounded-full p-1 transition-colors ${bloquear ? 'bg-primario' : 'bg-slate-300'}`}>
          <span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${bloquear ? 'translate-x-5' : ''}`} />
        </span>
        <span>
          <span className="block font-bold text-texto">Bloquear ventas sin stock</span>
          <span className="block text-sm text-texto-suave mt-0.5">
            {bloquear
              ? 'Activado: no se puede cargar más de lo disponible (stock menos lo precargado).'
              : 'Apagado: se puede vender aunque no haya stock. El stock se sigue descontando y puede quedar en negativo. Activalo cuando tengan el stock cargado y al día.'}
          </span>
        </span>
      </button>
    </div>
  )
}

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
    <div className="max-w-3xl px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-texto">Configuración</h1>
        <p className="text-texto-suave mt-0.5">Datos de la distribuidora y opciones del sistema</p>
      </div>

      <div className="space-y-4">
      <OpcionesStock />
      <div className="bg-white rounded-xl shadow-tarjeta border border-borde p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-primario-suave rounded-lg p-2">
            <Building2 className="w-5 h-5 text-primario" />
          </div>
          <h2 className="text-lg font-extrabold text-texto">Datos de la empresa <span className="text-sm font-semibold text-texto-suave">· salen en la boleta</span></h2>
        </div>

        <form onSubmit={handleGuardar} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-texto-suave mb-1">Nombre comercial</label>
            <input
              value={form.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder="Distribuidora Rojas"
              className="w-full border border-borde rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primario"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-texto-suave mb-1">Razón Social</label>
            <input
              value={form.razon_social}
              onChange={(e) => handleChange('razon_social', e.target.value)}
              placeholder="Roberto Rojas"
              className="w-full border border-borde rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primario"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-texto-suave mb-1">CUIT</label>
            <input
              value={form.cuit}
              onChange={(e) => handleChange('cuit', e.target.value)}
              placeholder="20-12345678-9"
              className="w-full border border-borde rounded-xl px-4 py-3 text-base font-mono focus:outline-none focus:ring-2 focus:ring-primario"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-texto-suave mb-1">Ubicación</label>
            <input
              value={form.ubicacion}
              onChange={(e) => handleChange('ubicacion', e.target.value)}
              placeholder="Lolog N° 1026 — Villa María, Córdoba"
              className="w-full border border-borde rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primario"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-primario text-white rounded-xl text-base font-bold hover:bg-primario-oscuro transition-colors flex items-center justify-center gap-2 mt-2"
          >
            <Save className="w-5 h-5" />
            {guardado ? '✓ Guardado' : 'Guardar cambios'}
          </button>
        </form>
      </div>
      </div>
    </div>
  )
}
