import { useState, useRef, useEffect } from 'react'
import { Search, User, MapPin, CreditCard, FileSpreadsheet, Upload } from 'lucide-react'
import { motion } from 'framer-motion'
import { useClientes } from '../../hooks/useClientes'
import usePedidoStore from '../../store/pedidoStore'

export default function BuscadorCliente() {
  const [termino, setTermino] = useState('')
  const { clientes, cargando, buscar } = useClientes()
  const seleccionarCliente = usePedidoStore((s) => s.seleccionarCliente)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const manejarInput = (e) => {
    const val = e.target.value
    setTermino(val)
    buscar(val)
  }

  const elegirCliente = (cliente) => {
    seleccionarCliente(cliente)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-extrabold text-texto mb-2">Seleccionar cliente</h1>
            <div className="relative">
              <Search className="absolute left-3 inset-y-0 my-auto w-5 h-5 text-texto-suave" />
              <input
                ref={inputRef}
                type="text"
                value={termino}
                onChange={manejarInput}
                placeholder="Buscar por nombre o número..."
                className="w-full pl-10 pr-4 py-2.5 text-lg border-2 border-gray-200 rounded-xl
                           focus:outline-none focus:border-primario focus:ring-4 focus:ring-blue-100
                           transition-all bg-white"
              />
              {cargando && (
                <div className="absolute inset-y-0 right-3 flex items-center">
                  <div className="w-4 h-4 border-2 border-primario border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Botones exportar / subir */}
          <div className="flex gap-2 shrink-0">
            <button
              disabled
              title="Próximamente"
              className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 rounded-xl
                         text-sm font-semibold text-texto-suave opacity-50 cursor-not-allowed"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Exportar Excel
            </button>
            <button
              disabled
              title="Próximamente"
              className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 rounded-xl
                         text-sm font-semibold text-texto-suave opacity-50 cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              Subir clientes
            </button>
          </div>
        </div>
      </div>

      {/* Lista de clientes */}
      <div className="flex-1 overflow-y-auto p-4">
        {!cargando && clientes.length === 0 && (
          <p className="text-center text-texto-suave py-12">
            No se encontraron clientes
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {clientes.map((cliente, i) => (
            <motion.button
              key={cliente.cod_cliente}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => elegirCliente(cliente)}
              className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-100
                         shadow-sm hover:border-primario hover:shadow-md text-left transition-all"
            >
              <div className="bg-blue-50 rounded-full p-1.5 shrink-0 mt-0.5">
                <User className="w-4 h-4 text-primario" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-texto text-sm leading-tight truncate">
                  {cliente.razon_social}
                </p>
                <div className="flex flex-wrap gap-2 mt-0.5">
                  {cliente.domicilio && (
                    <span className="flex items-center gap-1 text-xs text-texto-suave truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {cliente.domicilio}
                    </span>
                  )}
                  {cliente.condicion_venta && (
                    <span className="flex items-center gap-1 text-xs text-texto-suave">
                      <CreditCard className="w-3 h-3 shrink-0" />
                      {cliente.condicion_venta}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xs font-mono text-texto-suave shrink-0">
                #{cliente.cod_cliente}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}
