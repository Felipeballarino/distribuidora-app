const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { inicializarDB } = require('./db/connection')
const clientesDB = require('./db/clientes')
const productosDB = require('./db/productos')
const comprobantesDB = require('./db/comprobantes')

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function crearVentana() {
  const ventana = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'default',
    title: 'Distribuidora — Carga de Pedidos',
  })

  if (isDev) {
    ventana.loadURL('http://localhost:5173')
    ventana.webContents.openDevTools()
  } else {
    ventana.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  inicializarDB()
  crearVentana()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) crearVentana()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// IPC: Clientes
ipcMain.handle('clientes:buscar', async (_event, termino) => {
  return clientesDB.buscarClientes(termino)
})

// IPC: Productos
ipcMain.handle('productos:buscar', async (_event, termino) => {
  return productosDB.buscarProductos(termino)
})

ipcMain.handle('productos:porCategoria', async (_event, categoria) => {
  return productosDB.buscarPorCategoria(categoria)
})

// IPC: Comprobantes
ipcMain.handle('comprobantes:emitir', async (_event, datos) => {
  return comprobantesDB.emitirComprobante(datos)
})

ipcMain.handle('comprobantes:ultimo', async () => {
  return comprobantesDB.obtenerUltimoNumero()
})
