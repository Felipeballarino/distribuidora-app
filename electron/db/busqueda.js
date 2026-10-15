// Búsqueda por palabras, sin importar mayúsculas ni acentos:
// "jamon coc" encuentra "Jamón Cocido", "rincon" encuentra "Restaurante El Rincón".
// SQLite (LIKE) distingue acentos, por eso se filtra acá. Son pocos cientos de filas.

const normalizar = (texto) =>
  String(texto ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

const palabrasDe = (termino) => normalizar(termino).split(/\s+/).filter(Boolean)

// true si todas las palabras aparecen en alguno de los campos
function coincide(fila, campos, palabras) {
  const texto = campos.map((c) => normalizar(fila[c])).join(' ')
  return palabras.every((p) => texto.includes(p))
}

module.exports = { normalizar, palabrasDe, coincide }
