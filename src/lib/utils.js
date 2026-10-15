export function formatearPrecio(valor) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(valor)
}

// SQLite guarda CURRENT_TIMESTAMP en UTC sin zona ("2026-10-13 19:00:00"): se marca como UTC
const FECHA_SQLITE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/

export function formatearFecha(fecha) {
  if (typeof fecha === 'string' && FECHA_SQLITE.test(fecha)) fecha = fecha.replace(' ', 'T') + 'Z'
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(fecha))
}

export function formatearCantidad(valor, unidad) {
  if (unidad === 'kg') {
    return `${Number(valor).toFixed(3)} kg`
  }
  return `${Number(valor)} unid`
}

export function clsx(...clases) {
  return clases.filter(Boolean).join(' ')
}

// "hoy 18:40", "ayer 18:40" o "12/10 18:40"
export function fechaCorta(fecha) {
  if (typeof fecha === 'string' && FECHA_SQLITE.test(fecha)) fecha = fecha.replace(' ', 'T') + 'Z'
  const d = new Date(fecha)
  if (isNaN(d)) return ''
  const hora = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  const hoy = new Date()
  const dia = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const dias = Math.round((dia(hoy) - dia(d)) / 86400000)
  if (dias === 0) return `hoy ${hora}`
  if (dias === 1) return `ayer ${hora}`
  return `${d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })} ${hora}`
}

// Importe sin el signo $, con punto de miles: 4600 → "4.600", 4255.5 → "4.255,50"
const fmtImporte0 = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 })
const fmtImporte2 = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const formatearImporte = (n) => (Number.isInteger(Number(n)) ? fmtImporte0 : fmtImporte2).format(Number(n) || 0)
