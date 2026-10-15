import { useState, forwardRef } from 'react'
import { parsearNumero } from '../../lib/pedido'

// Número con coma decimal ("4,5"). Mientras se escribe guarda el texto;
// confirma al salir del campo o con Enter. Escape descarta lo escrito.
// `formato`: cómo se muestra cuando no se está editando (ej: precios con punto de miles).
// Con formato, el texto se lee en formato argentino: "4.600" = 4600, "4.255,50" = 4255.5.
// "4.600" → 4600 · "4.255,5" → 4255.5 · "4,5" → 4.5 · "4.5" → 4.5
function parsearImporte(texto) {
  let t = String(texto ?? '').trim()
  if (t === '') return null
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.')
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '')
  const n = Number(t)
  return isNaN(n) ? null : n
}

const aTexto = (n) => (n === null || n === undefined || n === '' ? '' : String(n).replace('.', ','))

const InputDecimal = forwardRef(function InputDecimal(
  { valor, onConfirmar, placeholder = '', className = '', decimales = true, onEnter, formato, ...resto },
  ref
) {
  const [texto, setTexto] = useState(null)
  const vacio = valor === null || valor === undefined || valor === ''
  const mostrado = texto ?? (formato && !vacio ? formato(valor) : aTexto(valor))

  const confirmar = () => {
    if (texto === null) return
    const n = formato ? parsearImporte(texto) : parsearNumero(texto)
    onConfirmar(n !== null && n >= 0 ? n : null)
    setTexto(null)
  }

  return (
    <input
      ref={ref}
      inputMode={decimales ? 'decimal' : 'numeric'}
      value={mostrado}
      placeholder={placeholder}
      onChange={(e) => setTexto(e.target.value.replace(decimales ? /[^\d.,]/g : /[^\d]/g, ''))}
      onBlur={confirmar}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          confirmar()
          onEnter?.(e)
        }
        if (e.key === 'Escape') {
          setTexto(null)
          e.currentTarget.blur()
        }
      }}
      onFocus={(e) => e.target.select()}
      className={className}
      {...resto}
    />
  )
})

export default InputDecimal
