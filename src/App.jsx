import { AnimatePresence, motion } from 'framer-motion'
import usePedidoStore from './store/pedidoStore'
import BuscadorCliente from './components/BuscadorCliente'
import SelectorProducto from './components/SelectorProducto'
import ResumenPedido from './components/ResumenPedido'
import ComprobanteEmitido from './components/ComprobanteEmitido'

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

export default function App() {
  const paso = usePedidoStore((s) => s.paso)
  const direccion = usePedidoStore((s) => s.direccion)

  const componentes = {
    cliente: <BuscadorCliente />,
    productos: <SelectorProducto />,
    resumen: <ResumenPedido />,
    emitido: <ComprobanteEmitido />,
  }

  return (
    <div className="h-screen overflow-hidden bg-fondo flex flex-col">
      {/* Barra de progreso */}
      {paso !== 'emitido' && (
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 shadow-sm">
          <span className="text-primario font-bold text-lg">Distribuidora</span>
          <div className="flex gap-2 ml-4">
            {['cliente', 'productos', 'resumen'].map((p, i) => (
              <div
                key={p}
                className={`flex items-center gap-1 text-sm font-semibold px-3 py-1 rounded-full transition-colors ${
                  PASOS.indexOf(paso) >= i
                    ? 'bg-primario text-white'
                    : 'bg-gray-100 text-texto-suave'
                }`}
              >
                <span>{i + 1}</span>
                <span className="hidden sm:inline">
                  {p === 'cliente' ? 'Cliente' : p === 'productos' ? 'Productos' : 'Resumen'}
                </span>
              </div>
            ))}
          </div>
        </header>
      )}

      {/* Contenido principal con animación */}
      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence initial={false} custom={direccion} mode="wait">
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
      </main>
    </div>
  )
}
