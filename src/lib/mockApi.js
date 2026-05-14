// API simulada para desarrollo en el navegador (sin Electron)
const IVA = 0.21

let clientes = [
  { id: 1, cod_cliente: '001', razon_social: 'Supermercado El Ahorro', domicilio: 'Av. San Martín 1234', condicion_venta: '30 días', cuit: '30-12345678-9' },
  { id: 2, cod_cliente: '002', razon_social: 'Almacén Don Pedro', domicilio: 'Belgrano 456', condicion_venta: 'Contado', cuit: '20-87654321-3' },
  { id: 3, cod_cliente: '003', razon_social: 'Minimarket La Esquina', domicilio: 'Mitre 789', condicion_venta: 'Contado', cuit: '30-11223344-7' },
  { id: 4, cod_cliente: '004', razon_social: 'Buffet Escuela Primaria N°12', domicilio: 'Las Flores 321', condicion_venta: '15 días', cuit: '30-44332211-5' },
  { id: 5, cod_cliente: '005', razon_social: 'Hotel Central', domicilio: '9 de Julio 567', condicion_venta: '30 días', cuit: '30-55667788-1' },
  { id: 6, cod_cliente: '006', razon_social: 'Panadería La Espiga de Oro', domicilio: 'Rivadavia 890', condicion_venta: 'Contado', cuit: '20-33445566-8' },
  { id: 7, cod_cliente: '007', razon_social: 'Restaurante El Rincón', domicilio: 'Colón 234', condicion_venta: '15 días', cuit: '30-77889900-2' },
  { id: 8, cod_cliente: '008', razon_social: 'Distribuidora Norte SRL', domicilio: 'Corrientes 111', condicion_venta: '60 días', cuit: '30-99001122-4' },
  { id: 9, cod_cliente: '009', razon_social: 'Cooperativa de Consumo', domicilio: 'Independencia 400', condicion_venta: '30 días', cuit: '30-22334455-6' },
  { id: 10, cod_cliente: '010', razon_social: 'Kiosco y Almacén Ramírez', domicilio: 'Tucumán 678', condicion_venta: 'Contado', cuit: '20-66778899-0' },
]

let productos = [
  { id: 1, cod_articulo: 'Q001', denominacion: 'Queso Cremoso x kg', unidad_medida: 'kg', precio_neto: 1800, precio_con_iva: parseFloat((1800 * (1 + IVA)).toFixed(2)), categoria: 'Quesos' },
  { id: 2, cod_articulo: 'Q002', denominacion: 'Queso Mozzarella x kg', unidad_medida: 'kg', precio_neto: 2100, precio_con_iva: parseFloat((2100 * (1 + IVA)).toFixed(2)), categoria: 'Quesos' },
  { id: 3, cod_articulo: 'Q003', denominacion: 'Queso Sardo x kg', unidad_medida: 'kg', precio_neto: 2400, precio_con_iva: parseFloat((2400 * (1 + IVA)).toFixed(2)), categoria: 'Quesos' },
  { id: 4, cod_articulo: 'Q004', denominacion: 'Queso Mar del Plata x kg', unidad_medida: 'kg', precio_neto: 2200, precio_con_iva: parseFloat((2200 * (1 + IVA)).toFixed(2)), categoria: 'Quesos' },
  { id: 5, cod_articulo: 'M001', denominacion: 'Manteca x 200g', unidad_medida: 'unid', precio_neto: 850, precio_con_iva: parseFloat((850 * (1 + IVA)).toFixed(2)), categoria: 'Manteca' },
  { id: 6, cod_articulo: 'M002', denominacion: 'Manteca x 500g', unidad_medida: 'unid', precio_neto: 1900, precio_con_iva: parseFloat((1900 * (1 + IVA)).toFixed(2)), categoria: 'Manteca' },
  { id: 7, cod_articulo: 'Y001', denominacion: 'Yogur Natural x 190g', unidad_medida: 'unid', precio_neto: 320, precio_con_iva: parseFloat((320 * (1 + IVA)).toFixed(2)), categoria: 'Yogures' },
  { id: 8, cod_articulo: 'Y002', denominacion: 'Yogur Frutado x 190g', unidad_medida: 'unid', precio_neto: 340, precio_con_iva: parseFloat((340 * (1 + IVA)).toFixed(2)), categoria: 'Yogures' },
  { id: 9, cod_articulo: 'Y003', denominacion: 'Yogur Entero x 1kg', unidad_medida: 'unid', precio_neto: 1400, precio_con_iva: parseFloat((1400 * (1 + IVA)).toFixed(2)), categoria: 'Yogures' },
  { id: 10, cod_articulo: 'L001', denominacion: 'Leche Entera x 1L', unidad_medida: 'unid', precio_neto: 550, precio_con_iva: parseFloat((550 * (1 + IVA)).toFixed(2)), categoria: 'Leche' },
  { id: 11, cod_articulo: 'L002', denominacion: 'Leche Descremada x 1L', unidad_medida: 'unid', precio_neto: 580, precio_con_iva: parseFloat((580 * (1 + IVA)).toFixed(2)), categoria: 'Leche' },
  { id: 12, cod_articulo: 'C001', denominacion: 'Crema de Leche x 200ml', unidad_medida: 'unid', precio_neto: 680, precio_con_iva: parseFloat((680 * (1 + IVA)).toFixed(2)), categoria: 'Cremas' },
  { id: 13, cod_articulo: 'C002', denominacion: 'Crema de Leche x 500ml', unidad_medida: 'unid', precio_neto: 1500, precio_con_iva: parseFloat((1500 * (1 + IVA)).toFixed(2)), categoria: 'Cremas' },
  { id: 14, cod_articulo: 'C004', denominacion: 'Dulce de Leche Repostero x 500g', unidad_medida: 'unid', precio_neto: 1100, precio_con_iva: parseFloat((1100 * (1 + IVA)).toFixed(2)), categoria: 'Cremas' },
]

let nextClienteId = 11
let nextProductoId = 15
let contadorComprobante = 1

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms))

export const mockApi = {
  clientes: {
    buscar: async (termino) => {
      await delay()
      if (!termino) return clientes.map(({ id: _id, ...c }) => c)
      const t = termino.toLowerCase()
      return clientes
        .filter((c) => c.razon_social.toLowerCase().includes(t) || c.cod_cliente.includes(t))
        .map(({ id: _id, ...c }) => c)
    },
    listar: async () => {
      await delay()
      return [...clientes]
    },
    crear: async (datos) => {
      await delay(200)
      clientes.push({ id: nextClienteId++, ...datos })
      return { ok: true }
    },
    actualizar: async (id, datos) => {
      await delay(200)
      const idx = clientes.findIndex((c) => c.id === id)
      if (idx >= 0) clientes[idx] = { ...clientes[idx], ...datos }
      return { ok: true }
    },
    eliminar: async (id) => {
      await delay(200)
      clientes = clientes.filter((c) => c.id !== id)
      return { ok: true }
    },
    importar: async (filas) => {
      await delay(300)
      let importados = 0
      for (const f of filas) {
        const cod = String(f['Código'] || f['Codigo'] || f.cod_cliente || '').trim()
        const razon = String(f['Razón Social'] || f['Razon Social'] || f.razon_social || '').trim()
        if (!cod || !razon) continue
        const existente = clientes.findIndex((c) => c.cod_cliente === cod)
        const nuevo = {
          id: existente >= 0 ? clientes[existente].id : nextClienteId++,
          cod_cliente: cod,
          razon_social: razon,
          domicilio: String(f['Domicilio'] || f.domicilio || '').trim(),
          condicion_venta: String(f['Condición de Venta'] || f['Condicion de Venta'] || f.condicion_venta || 'Contado').trim(),
          cuit: String(f['CUIT'] || f.cuit || '').trim(),
        }
        if (existente >= 0) clientes[existente] = nuevo
        else clientes.push(nuevo)
        importados++
      }
      return { importados }
    },
  },

  productos: {
    buscar: async (termino) => {
      await delay()
      const t = termino.toLowerCase()
      return productos.filter(
        (p) => p.denominacion.toLowerCase().includes(t) || p.categoria.toLowerCase().includes(t)
      )
    },
    porCategoria: async (categoria) => {
      await delay(80)
      if (!categoria || categoria === 'Todos') return [...productos]
      return productos.filter((p) => p.categoria === categoria)
    },
    listar: async () => {
      await delay()
      return [...productos]
    },
    crear: async (datos) => {
      await delay(200)
      productos.push({ id: nextProductoId++, activo: 1, ...datos })
      return { ok: true }
    },
    actualizar: async (id, datos) => {
      await delay(200)
      const idx = productos.findIndex((p) => p.id === id)
      if (idx >= 0) productos[idx] = { ...productos[idx], ...datos }
      return { ok: true }
    },
    eliminar: async (id) => {
      await delay(200)
      productos = productos.filter((p) => p.id !== id)
      return { ok: true }
    },
    importar: async (filas) => {
      await delay(300)
      let importados = 0
      for (const f of filas) {
        const cod = String(f['Código'] || f['Codigo'] || f.cod_articulo || '').trim()
        const den = String(f['Denominación'] || f['Denominacion'] || f.denominacion || '').trim()
        if (!cod || !den) continue
        const pNeto = parseFloat(f['Precio Neto'] || f.precio_neto || 0)
        const pIva = parseFloat(f['Precio c/IVA'] || f['Precio con IVA'] || f.precio_con_iva || pNeto * 1.21)
        const existente = productos.findIndex((p) => p.cod_articulo === cod)
        const nuevo = {
          id: existente >= 0 ? productos[existente].id : nextProductoId++,
          cod_articulo: cod,
          denominacion: den,
          unidad_medida: String(f['Unidad'] || f.unidad_medida || 'unid').trim(),
          precio_neto: pNeto,
          precio_con_iva: pIva,
          categoria: String(f['Categoría'] || f['Categoria'] || f.categoria || '').trim(),
          activo: 1,
        }
        if (existente >= 0) productos[existente] = nuevo
        else productos.push(nuevo)
        importados++
      }
      return { importados }
    },
  },

  comprobantes: {
    emitir: async ({ cliente, items, totales }) => {
      await delay(300)
      const numero = String(contadorComprobante++).padStart(8, '0')
      return { id: contadorComprobante, numero }
    },
    ultimoNumero: async () => contadorComprobante,
  },
}
