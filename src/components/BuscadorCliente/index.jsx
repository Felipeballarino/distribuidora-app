import { useState, useRef, useEffect } from 'react'
import { Search, MapPin, ClipboardList, ArrowRight, Trash2, CheckCircle2, X } from 'lucide-react'
import { useClientes } from '../../hooks/useClientes'
import usePedidoStore from '../../store/pedidoStore'
import { formatearPrecio, fechaCorta } from '../../lib/utils'

// Pedidos precargados (armados el día anterior) para terminar
function Precargas({ precargas, onTerminar, onDescartar }) {
  const [confirmando, setConfirmando] = useState(null)

  const descartar = (id) => {
    if (confirmando !== id) {
      setConfirmando(id)
      setTimeout(() => setConfirmando((c) => (c === id ? null : c)), 3000)
      return
    }
    setConfirmando(null)
    onDescartar(id)
  }

  return (
    <section className="mb-8">
      <h2 className="flex items-center gap-2 text-sm font-bold text-texto-suave uppercase tracking-wide mb-3">
        <ClipboardList className="w-4 h-4" />
        Precargados para terminar
        <span className="ml-1 px-2 py-0.5 rounded-full bg-aviso-suave text-aviso text-xs">{precargas.length}</span>
      </h2>
      <div className="bg-white rounded-xl border border-borde shadow-tarjeta divide-y divide-borde">
        {precargas.map((p) => (
          <div key={p.id} className="flex items-center gap-4 px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-texto truncate">{p.razon_social}</p>
              <p className="text-sm text-texto-suave">
                {p.items.length} {p.items.length === 1 ? 'producto' : 'productos'}
                {' · '}<span className="font-mono">{formatearPrecio(p.total)}</span>
                {' · '}precargado {fechaCorta(p.actualizado || p.creado)}
              </p>
            </div>
            <button
              onClick={() => descartar(p.id)}
              className={`h-11 px-3 rounded-lg font-semibold text-sm flex items-center gap-1.5 transition-colors
                ${confirmando === p.id ? 'bg-peligro text-white' : 'text-texto-suave hover:bg-peligro-suave hover:text-peligro'}`}
            >
              <Trash2 className="w-4 h-4" />
              {confirmando === p.id ? '¿Descartar? Tocá de nuevo' : 'Descartar'}
            </button>
            <button
              onClick={() => onTerminar(p.id)}
              className="h-11 px-4 rounded-lg bg-primario text-white font-bold flex items-center gap-2 hover:bg-primario-oscuro"
            >
              Terminar <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function BuscadorCliente() {
  const [termino, setTermino] = useState('')
  const [precargas, setPrecargas] = useState([])
  const { clientes, cargando, buscar } = useClientes()
  const seleccionarCliente = usePedidoStore((s) => s.seleccionarCliente)
  const cargarPrecarga = usePedidoStore((s) => s.cargarPrecarga)
  const aviso = usePedidoStore((s) => s.aviso)
  const cerrarAviso = usePedidoStore((s) => s.cerrarAviso)
  const inputRef = useRef(null)

  const cargarPrecargas = async () => setPrecargas(await window.api.precargas.listar())

  useEffect(() => {
    inputRef.current?.focus()
    cargarPrecargas()
  }, [])

  const terminar = async (id) => {
    const precarga = await window.api.precargas.obtener(id)
    if (precarga) cargarPrecarga(precarga)
    else cargarPrecargas()
  }

  const descartar = async (id) => {
    await window.api.precargas.descartar(id)
    cargarPrecargas()
  }

  const conPrecarga = new Set(precargas.map((p) => p.cod_cliente))

  return (
    <div className="max-w-5xl mx-auto px-8 py-8">
      <h1 className="text-2xl font-extrabold text-texto">Nuevo pedido</h1>
      <p className="text-texto-suave mb-5">Buscá el cliente por nombre o número</p>

      <div className="relative mb-6">
        <Search className="absolute left-4 inset-y-0 my-auto w-5 h-5 text-texto-suave" />
        <input
          ref={inputRef}
          type="text"
          value={termino}
          onChange={(e) => { setTermino(e.target.value); buscar(e.target.value) }}
          onKeyDown={(e) => {
            // Enter elige el primero de la lista
            if (e.key === 'Enter' && termino.trim() && clientes[0]) seleccionarCliente(clientes[0])
          }}
          placeholder="Ej: don pedro, 002..."
          className="w-full pl-12 pr-4 h-14 text-lg bg-white border-2 border-borde rounded-xl
                     focus:outline-none focus:border-primario focus:ring-4 focus:ring-primario/10"
        />
        {cargando && (
          <div className="absolute inset-y-0 right-4 flex items-center">
            <div className="w-4 h-4 border-2 border-primario border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {aviso && (
        <div className="mb-6 flex items-center gap-3 bg-secundario-suave text-secundario font-semibold rounded-xl px-4 py-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="flex-1">{aviso}</span>
          <button onClick={cerrarAviso} className="p-1 rounded hover:bg-white/60"><X className="w-4 h-4" /></button>
        </div>
      )}

      {precargas.length > 0 && !termino && (
        <Precargas precargas={precargas} onTerminar={terminar} onDescartar={descartar} />
      )}

      <h2 className="text-sm font-bold text-texto-suave uppercase tracking-wide mb-3">Clientes</h2>
      {!cargando && clientes.length === 0 ? (
        <p className="text-texto-suave py-10 text-center">No se encontraron clientes</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {clientes.map((cliente, i) => (
            <button
              key={cliente.cod_cliente}
              onClick={() => seleccionarCliente(cliente)}
              className={`group flex items-center gap-3 px-4 h-16 bg-white rounded-xl border text-left transition-all
                hover:border-primario hover:shadow-tarjeta
                ${i === 0 && termino ? 'border-primario/50 ring-2 ring-primario/10' : 'border-borde'}`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold text-texto truncate">{cliente.razon_social}</p>
                {cliente.domicilio && (
                  <p className="flex items-center gap-1 text-sm text-texto-suave truncate">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />{cliente.domicilio}
                  </p>
                )}
              </div>
              {conPrecarga.has(cliente.cod_cliente) && (
                <span className="shrink-0 text-xs font-bold px-2 py-1 rounded-md bg-aviso-suave text-aviso">Precargado</span>
              )}
              <span className="shrink-0 text-sm font-mono text-texto-suave">#{cliente.cod_cliente}</span>
              <ArrowRight className="w-4 h-4 text-texto-suave opacity-0 group-hover:opacity-100 shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
