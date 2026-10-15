const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  clientes: {
    buscar: (termino) => ipcRenderer.invoke('clientes:buscar', termino),
    listar: () => ipcRenderer.invoke('clientes:listar'),
    crear: (datos) => ipcRenderer.invoke('clientes:crear', datos),
    actualizar: (id, datos) => ipcRenderer.invoke('clientes:actualizar', id, datos),
    eliminar: (id) => ipcRenderer.invoke('clientes:eliminar', id),
    importar: (filas) => ipcRenderer.invoke('clientes:importar', filas),
  },
  productos: {
    buscar: (termino) => ipcRenderer.invoke('productos:buscar', termino),
    porCategoria: (categoria) => ipcRenderer.invoke('productos:porCategoria', categoria),
    listar: () => ipcRenderer.invoke('precios:listar'),
    crear: (datos) => ipcRenderer.invoke('precios:crear', datos),
    actualizar: (id, datos) => ipcRenderer.invoke('precios:actualizar', id, datos),
    eliminar: (id) => ipcRenderer.invoke('precios:eliminar', id),
    importar: (filas) => ipcRenderer.invoke('precios:importar', filas),
    aumentar: (datos) => ipcRenderer.invoke('precios:aumentar', datos),
    aumentos: () => ipcRenderer.invoke('precios:aumentos'),
  },
  comprobantes: {
    emitir: (datos) => ipcRenderer.invoke('comprobantes:emitir', datos),
    ultimoNumero: () => ipcRenderer.invoke('comprobantes:ultimo'),
    listar: () => ipcRenderer.invoke('comprobantes:listar'),
    anular: (id) => ipcRenderer.invoke('comprobantes:anular', id),
  },
  stock: {
    ingresar: (cod, cantidad, nota) => ipcRenderer.invoke('stock:ingresar', cod, cantidad, nota),
    ajustar: (cod, contado, nota) => ipcRenderer.invoke('stock:ajustar', cod, contado, nota),
    movimientos: (cod) => ipcRenderer.invoke('stock:movimientos', cod),
  },
  precargas: {
    guardar: (datos) => ipcRenderer.invoke('precargas:guardar', datos),
    listar: () => ipcRenderer.invoke('precargas:listar'),
    obtener: (id) => ipcRenderer.invoke('precargas:obtener', id),
    descartar: (id) => ipcRenderer.invoke('precargas:descartar', id),
  },
  config: {
    leer: () => ipcRenderer.invoke('config:leer'),
    guardar: (cambios) => ipcRenderer.invoke('config:guardar', cambios),
  },
})
