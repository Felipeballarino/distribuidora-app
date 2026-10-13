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
