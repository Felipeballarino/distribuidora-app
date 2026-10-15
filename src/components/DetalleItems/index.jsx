import { formatearPrecio } from '../../lib/utils'
import { precioDeItem, subtotalItem, textoCantidad, textoKg, sufijoUnidad } from '../../lib/pedido'

// Tabla de ítems de un pedido ya emitido (pantalla de éxito e historial)
export default function DetalleItems({ items, compacta = false }) {
  const celda = compacta ? 'px-3 py-2' : 'px-4 py-3'
  return (
    <table className="w-full text-left">
      <thead className="bg-fondo">
        <tr className="text-xs font-bold text-texto-suave">
          <th className={celda}>Producto</th>
          <th className={`${celda} text-center`}>Cant.</th>
          <th className={`${celda} text-center`}>Kg</th>
          <th className={`${celda} text-right`}>Precio</th>
          <th className={`${celda} text-right`}>Subtotal</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => (
          <tr key={`${item.cod_articulo}-${i}`} className={`border-t border-gray-50 ${i % 2 ? 'bg-gray-50/50' : ''}`}>
            <td className={`${celda} font-semibold text-texto text-sm`}>{item.denominacion}</td>
            <td className={`${celda} text-center font-mono text-sm`}>{textoCantidad(item)}</td>
            <td className={`${celda} text-center font-mono text-sm whitespace-nowrap`}>{textoKg(item)}</td>
            <td className={`${celda} text-right font-mono text-sm whitespace-nowrap`}>
              {formatearPrecio(precioDeItem(item))}
              <span className="text-xs text-texto-suave">{sufijoUnidad(item)}</span>
            </td>
            <td className={`${celda} text-right font-mono font-bold text-sm text-texto whitespace-nowrap`}>
              {formatearPrecio(subtotalItem(item))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
