const { Database } = require('node-sqlite3-wasm')
const path = require('path')
const fs = require('fs')

const DB_PATH = process.env.LOCAL_DB_PATH || path.join(__dirname, '../../data/distribuidora.db')

let db = null

function inicializarDB() {
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  db = new Database(DB_PATH)

  db.exec(`
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cod_cliente TEXT UNIQUE NOT NULL,
      razon_social TEXT NOT NULL,
      domicilio TEXT,
      condicion_venta TEXT DEFAULT 'Contado',
      cuit TEXT,
      activo INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS precios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cod_articulo TEXT NOT NULL,
      denominacion TEXT NOT NULL,
      unidad_medida TEXT DEFAULT 'unid',
      precio_neto REAL NOT NULL,
      precio_con_iva REAL NOT NULL,
      categoria TEXT,
      activo INTEGER DEFAULT 1,
      fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS comprobantes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero TEXT NOT NULL,
      cod_cliente TEXT NOT NULL,
      razon_social TEXT NOT NULL,
      fecha TEXT DEFAULT CURRENT_TIMESTAMP,
      total_neto REAL,
      total_iva REAL,
      total_final REAL,
      items TEXT
    );
  `)

  console.log('Base de datos inicializada en:', DB_PATH)
  return db
}

function getDB() {
  if (!db) throw new Error('Base de datos no inicializada')
  return db
}

module.exports = { inicializarDB, getDB }
