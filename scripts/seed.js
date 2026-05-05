// Script para poblar la base de datos local con datos de prueba
// Usa node:sqlite (nativo en Node v22+, sin compilación requerida)
const { DatabaseSync } = require('node:sqlite')
const path = require('path')
const fs = require('fs')

const DB_PATH = path.join(__dirname, '../data/distribuidora.db')

const dir = path.dirname(DB_PATH)
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true })
}

const db = new DatabaseSync(DB_PATH)

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

db.exec('DELETE FROM clientes; DELETE FROM precios;')

const clientes = [
  { cod: '001', rs: 'Supermercado El Ahorro', dom: 'Av. San Martín 1234', cond: '30 días', cuit: '30-12345678-9' },
  { cod: '002', rs: 'Almacén Don Pedro', dom: 'Belgrano 456', cond: 'Contado', cuit: '20-87654321-3' },
  { cod: '003', rs: 'Minimarket La Esquina', dom: 'Mitre 789', cond: 'Contado', cuit: '30-11223344-7' },
  { cod: '004', rs: 'Buffet Escuela Primaria N°12', dom: 'Las Flores 321', cond: '15 días', cuit: '30-44332211-5' },
  { cod: '005', rs: 'Hotel Central', dom: '9 de Julio 567', cond: '30 días', cuit: '30-55667788-1' },
  { cod: '006', rs: 'Panadería La Espiga de Oro', dom: 'Rivadavia 890', cond: 'Contado', cuit: '20-33445566-8' },
  { cod: '007', rs: 'Restaurante El Rincón', dom: 'Colón 234', cond: '15 días', cuit: '30-77889900-2' },
  { cod: '008', rs: 'Distribuidora Norte SRL', dom: 'Corrientes 111', cond: '60 días', cuit: '30-99001122-4' },
  { cod: '009', rs: 'Cooperativa de Consumo', dom: 'Independencia 400', cond: '30 días', cuit: '30-22334455-6' },
  { cod: '010', rs: 'Kiosco y Almacén Ramírez', dom: 'Tucumán 678', cond: 'Contado', cuit: '20-66778899-0' },
]

const insCliente = db.prepare(
  'INSERT OR REPLACE INTO clientes (cod_cliente, razon_social, domicilio, condicion_venta, cuit) VALUES (?, ?, ?, ?, ?)'
)
for (const c of clientes) insCliente.run(c.cod, c.rs, c.dom, c.cond, c.cuit)

const IVA = 0.21
const productos = [
  { cod: 'Q001', nom: 'Queso Cremoso x kg', und: 'kg', neto: 1800, cat: 'Quesos' },
  { cod: 'Q002', nom: 'Queso Mozzarella x kg', und: 'kg', neto: 2100, cat: 'Quesos' },
  { cod: 'Q003', nom: 'Queso Sardo x kg', und: 'kg', neto: 2400, cat: 'Quesos' },
  { cod: 'Q004', nom: 'Queso Mar del Plata x kg', und: 'kg', neto: 2200, cat: 'Quesos' },
  { cod: 'Q005', nom: 'Queso de Máquina x kg', und: 'kg', neto: 1600, cat: 'Quesos' },
  { cod: 'Q006', nom: 'Queso Reggianito x kg', und: 'kg', neto: 2800, cat: 'Quesos' },
  { cod: 'M001', nom: 'Manteca x 200g', und: 'unid', neto: 850, cat: 'Manteca' },
  { cod: 'M002', nom: 'Manteca x 500g', und: 'unid', neto: 1900, cat: 'Manteca' },
  { cod: 'M003', nom: 'Manteca con sal x 200g', und: 'unid', neto: 880, cat: 'Manteca' },
  { cod: 'Y001', nom: 'Yogur Natural x 190g', und: 'unid', neto: 320, cat: 'Yogures' },
  { cod: 'Y002', nom: 'Yogur Frutado x 190g', und: 'unid', neto: 340, cat: 'Yogures' },
  { cod: 'Y003', nom: 'Yogur Entero x 1kg', und: 'unid', neto: 1400, cat: 'Yogures' },
  { cod: 'Y004', nom: 'Yogur Bebible x 1L', und: 'unid', neto: 900, cat: 'Yogures' },
  { cod: 'L001', nom: 'Leche Entera x 1L', und: 'unid', neto: 550, cat: 'Leche' },
  { cod: 'L002', nom: 'Leche Descremada x 1L', und: 'unid', neto: 580, cat: 'Leche' },
  { cod: 'L003', nom: 'Leche Entera x 500ml', und: 'unid', neto: 310, cat: 'Leche' },
  { cod: 'L004', nom: 'Leche Chocolatada x 1L', und: 'unid', neto: 720, cat: 'Leche' },
  { cod: 'C001', nom: 'Crema de Leche x 200ml', und: 'unid', neto: 680, cat: 'Cremas' },
  { cod: 'C002', nom: 'Crema de Leche x 500ml', und: 'unid', neto: 1500, cat: 'Cremas' },
  { cod: 'C003', nom: 'Crema Doble x 250g', und: 'unid', neto: 920, cat: 'Cremas' },
  { cod: 'C004', nom: 'Dulce de Leche Repostero x 500g', und: 'unid', neto: 1100, cat: 'Cremas' },
  { cod: 'C005', nom: 'Dulce de Leche Familiar x 1kg', und: 'unid', neto: 2000, cat: 'Cremas' },
]

const insPrecio = db.prepare(
  'INSERT OR REPLACE INTO precios (cod_articulo, denominacion, unidad_medida, precio_neto, precio_con_iva, categoria) VALUES (?, ?, ?, ?, ?, ?)'
)
for (const p of productos) {
  const conIva = parseFloat((p.neto * (1 + IVA)).toFixed(2))
  insPrecio.run(p.cod, p.nom, p.und, p.neto, conIva, p.cat)
}

db.close()

console.log(`✓ ${clientes.length} clientes cargados`)
console.log(`✓ ${productos.length} productos cargados`)
console.log(`✓ Base de datos lista en: ${DB_PATH}`)
