import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ShoppingCart, Tag, Users, FileText, Settings, Warehouse } from 'lucide-react'
import usePedidoStore from './store/pedidoStore'
import { getEmpresa } from './lib/empresa'
import BuscadorCliente from './components/BuscadorCliente'
import SelectorProducto from './components/SelectorProducto'
import ComprobanteEmitido from './components/ComprobanteEmitido'
import ListaPrecios from './components/ListaPrecios'
import ListaClientes from './components/ListaClientes'
import ListaVentas from './components/ListaVentas'
import Configuracion from './components/Configuracion'
import ControlStock from './components/ControlStock'

const SECCIONES = [
  { id: 'pedido', label: 'Pedidos', icon: ShoppingCart },
  { id: 'ventas', label: 'Historial', icon: FileText },
  { id: 'precios', label: 'Precios', icon: Tag },
  { id: 'stock', label: 'Stock', icon: Warehouse },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'config', label: 'Configuración', icon: Settings },
]

const PASOS_PEDIDO = {
  cliente: BuscadorCliente,
  productos: SelectorProducto,
  emitido: ComprobanteEmitido,
}

const OTRAS_SECCIONES = {
  precios: ListaPrecios,
  stock: ControlStock,
  clientes: ListaClientes,
  ventas: ListaVentas,
  config: Configuracion,
}

const fade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 },
}

function Menu({ seccion, onCambiar }) {
  const nombre = getEmpresa().nombre || 'Distribuidora'
  return (
    <aside className="w-16 xl:w-[200px] shrink-0 bg-white border-r border-borde flex flex-col">
      <div className="px-5 pt-5 pb-6 hidden xl:block">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-texto-suave">Pedidos</p>
        <p className="text-lg font-extrabold text-texto leading-tight truncate" title={nombre}>{nombre}</p>
      </div>
      <nav className="flex-1 px-3 pt-4 xl:pt-0 space-y-1">
        {SECCIONES.map(({ id, label, icon: Icon }) => {
          const activa = seccion === id
          return (
            <button
              key={id}
              onClick={() => onCambiar(id)}
              title={label}
              className={`w-full flex items-center justify-center xl:justify-start gap-3 px-3 h-11 rounded-lg text-[15px] font-semibold transition-colors
                ${activa ? 'bg-primario-suave text-primario' : 'text-texto-suave hover:bg-fondo hover:text-texto'}`}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={activa ? 2.4 : 2} />
              <span className="hidden xl:inline">{label}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

export default function App() {
  const [seccion, setSeccion] = useState('pedido')
  const paso = usePedidoStore((s) => s.paso)
  const cargarConfig = usePedidoStore((s) => s.cargarConfig)

  useEffect(() => { cargarConfig() }, [cargarConfig])

  const Pantalla = seccion === 'pedido' ? PASOS_PEDIDO[paso] : OTRAS_SECCIONES[seccion]
  const clave = seccion === 'pedido' ? `pedido-${paso}` : seccion

  return (
    <div className="h-screen overflow-hidden bg-fondo flex">
      <Menu seccion={seccion} onCambiar={setSeccion} />
      <main className="flex-1 min-w-0 relative">
        <AnimatePresence initial={false} mode="wait">
          <motion.div key={clave} {...fade} className="absolute inset-0 overflow-y-auto">
            <Pantalla />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
