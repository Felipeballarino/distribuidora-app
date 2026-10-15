const { getDB } = require('./connection')

// Configuración guardada en la base (no en el navegador), así la respeta también el servidor.
function leerConfig(db = getDB()) {
  const filas = db.all(`SELECT clave, valor FROM config`)
  const c = Object.fromEntries(filas.map((f) => [f.clave, f.valor]))
  return { bloquear_sin_stock: c.bloquear_sin_stock === '1' }
}

function guardarConfig(cambios) {
  const db = getDB()
  if ('bloquear_sin_stock' in cambios) {
    db.run(`INSERT OR REPLACE INTO config (clave, valor) VALUES ('bloquear_sin_stock', ?)`,
      [cambios.bloquear_sin_stock ? '1' : '0'])
  }
  return { ok: true, config: leerConfig(db) }
}

module.exports = { leerConfig, guardarConfig }
