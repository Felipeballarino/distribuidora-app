const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  clientes: {
    buscar: (termino) => ipcRenderer.invoke('clientes:buscar', termino),
  },
  productos: {
    buscar: (termino) => ipcRenderer.invoke('productos:buscar', termino),
    porCategoria: (categoria) => ipcRenderer.invoke('productos:porCategoria', categoria),
  },
  comprobantes: {
    emitir: (datos) => ipcRenderer.invoke('comprobantes:emitir', datos),
    ultimoNumero: () => ipcRenderer.invoke('comprobantes:ultimo'),
  },
})
