const { app } = require('electron')
const path = require('path')
const fs = require('fs')
const { DB_PATH } = require('./connection')

const DIAS_A_CONSERVAR = 30
const INTERVALO_MS = 24 * 60 * 60 * 1000 // 24hs

// Se guarda en Documentos para que sea fácil de ver/copiar a USB o nube,
// y porque en muchas PCs esa carpeta ya está sincronizada con OneDrive.
function obtenerCarpetaBackups() {
  const base = app.isPackaged
    ? app.getPath('documents')
    : path.join(__dirname, '../../data')
  return path.join(base, 'Distribuidora Pedidos - Backups')
}

function nombreBackupDeHoy() {
  const hoy = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  return `distribuidora-${hoy}.db`
}

function hacerBackup() {
  try {
    if (!fs.existsSync(DB_PATH)) return

    const carpeta = obtenerCarpetaBackups()
    if (!fs.existsSync(carpeta)) fs.mkdirSync(carpeta, { recursive: true })

    const destino = path.join(carpeta, nombreBackupDeHoy())
    if (fs.existsSync(destino)) return // ya se hizo el backup de hoy

    fs.copyFileSync(DB_PATH, destino)
    console.log('Backup creado en:', destino)

    limpiarBackupsViejos(carpeta)
  } catch (error) {
    console.error('Error al crear backup:', error)
  }
}

function limpiarBackupsViejos(carpeta) {
  const limite = Date.now() - DIAS_A_CONSERVAR * 24 * 60 * 60 * 1000
  for (const archivo of fs.readdirSync(carpeta)) {
    const ruta = path.join(carpeta, archivo)
    if (fs.statSync(ruta).mtimeMs < limite) fs.unlinkSync(ruta)
  }
}

function iniciarBackupsAutomaticos() {
  hacerBackup()
  setInterval(hacerBackup, INTERVALO_MS)
}

module.exports = { iniciarBackupsAutomaticos }
