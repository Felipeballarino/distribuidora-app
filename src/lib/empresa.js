const KEY = 'distribuidora_empresa'

export function getEmpresa() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {}
  } catch {
    return {}
  }
}

export function setEmpresa(datos) {
  localStorage.setItem(KEY, JSON.stringify(datos))
}
