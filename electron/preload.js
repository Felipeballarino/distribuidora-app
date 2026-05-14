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
  },
  comprobantes: {
    emitir: (datos) => ipcRenderer.invoke('comprobantes:emitir', datos),
    ultimoNumero: () => ipcRenderer.invoke('comprobantes:ultimo'),
    listar: () => ipcRenderer.invoke('comprobantes:listar'),
  },
})
