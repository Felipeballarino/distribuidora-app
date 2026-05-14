import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ShoppingCart, Tag, Users, FileText } from 'lucide-react'
import usePedidoStore from './store/pedidoStore'
import BuscadorCliente from './components/BuscadorCliente'
import SelectorProducto from './components/SelectorProducto'
import ResumenPedido from './components/ResumenPedido'
import ComprobanteEmitido from './components/ComprobanteEmitido'
import ListaPrecios from './components/ListaPrecios'
import ListaClientes from './components/ListaClientes'
import ListaVentas from './components/ListaVentas'

const PASOS = ['cliente', 'productos', 'resumen', 'emitido']

const variantes = {
  entrar: (direccion) => ({
    x: direccion > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  centro: { x: 0, opacity: 1 },
  salir: (direccion) => ({
    x: direccion < 0 ? '100%' : '-100%',
    opacity: 0,
  }),
}

const variantesFade = {
  entrar: { opacity: 0, y: 8 },
  centro: { opacity: 1, y: 0 },
  salir: { opacity: 0, y: -8 },
}

export default function App() {
  const [seccion, setSeccion] = useState('pedido')
  const paso = usePedidoStore((s) => s.paso)
  const direccion = usePedidoStore((s) => s.direccion)

  const componentes = {
    cliente: <BuscadorCliente />,
    productos: <SelectorProducto />,
    resumen: <ResumenPedido />,
    emitido: <ComprobanteEmitido />,
  }

  const navItems = [
    { id: 'pedido', label: 'Nuevo Pedido', icon: ShoppingCart },
    { id: 'precios', label: 'Lista de Precios', icon: Tag },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'ventas', label: 'Ventas', icon: FileText },
  ]

  const mostrarNavSuperior = paso !== 'emitido' || seccion !== 'pedido'

  return (
    <div className="h-screen overflow-hidden bg-fondo flex flex-col">
      {/* Header siempre visible */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 shadow-sm flex-shrink-0">
        <span className="text-primario font-extrabold text-xl tracking-tight">Distribuidora</span>

        {/* Navegación principal */}
        <nav className="flex gap-1 ml-2">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSeccion(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                seccion === id
                  ? 'bg-primario text-white'
                  : 'text-texto-suave hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>

        {/* Indicador de pasos (solo en sección pedido y no en emitido) */}
        {seccion === 'pedido' && paso !== 'emitido' && (
          <div className="flex gap-2 ml-auto">
            {['cliente', 'productos', 'resumen'].map((p, i) => (
              <div
                key={p}
                className={`flex items-center gap-1 text-sm font-semibold px-3 py-1 rounded-full transition-colors ${
                  PASOS.indexOf(paso) >= i
                    ? 'bg-primario/10 text-primario border border-primario/30'
                    : 'bg-gray-100 text-texto-suave'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  PASOS.indexOf(paso) >= i ? 'bg-primario text-white' : 'bg-gray-300 text-white'
                }`}>{i + 1}</span>
                <span className="hidden sm:inline">
                  {p === 'cliente' ? 'Cliente' : p === 'productos' ? 'Productos' : 'Resumen'}
                </span>
              </div>
            ))}
          </div>
        )}
      </header>

      {/* Contenido principal */}
      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence initial={false} mode="wait">
          {seccion === 'pedido' ? (
            <AnimatePresence initial={false} custom={direccion} mode="wait" key="pedido">
              <motion.div
                key={paso}
                custom={direccion}
                variants={variantes}
                initial="entrar"
                animate="centro"
                exit="salir"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="absolute inset-0 overflow-y-auto"
              >
                {componentes[paso]}
              </motion.div>
            </AnimatePresence>
          ) : seccion === 'precios' ? (
            <motion.div
              key="precios"
              variants={variantesFade}
              initial="entrar"
              animate="centro"
              exit="salir"
              transition={{ duration: 0.2 }}
              className="absolute inset-0 overflow-y-auto"
            >
              <ListaPrecios />
            </motion.div>
          ) : seccion === 'clientes' ? (
            <motion.div
              key="clientes"
              variants={variantesFade}
              initial="entrar"
              animate="centro"
              exit="salir"
              transition={{ duration: 0.2 }}
              className="absolute inset-0 overflow-y-auto"
            >
              <ListaClientes />
            </motion.div>
          ) : (
            <motion.div
              key="ventas"
              variants={variantesFade}
              initial="entrar"
              animate="centro"
              exit="salir"
              transition={{ duration: 0.2 }}
              className="absolute inset-0 overflow-y-auto"
            >
              <ListaVentas />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
