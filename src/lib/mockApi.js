// API simulada para desarrollo en el navegador (sin Electron)
const clientes = [
  { cod_cliente: '001', razon_social: 'Supermercado El Ahorro', domicilio: 'Av. San Martín 1234', condicion_venta: '30 días', cuit: '30-12345678-9' },
  { cod_cliente: '002', razon_social: 'Almacén Don Pedro', domicilio: 'Belgrano 456', condicion_venta: 'Contado', cuit: '20-87654321-3' },
  { cod_cliente: '003', razon_social: 'Minimarket La Esquina', domicilio: 'Mitre 789', condicion_venta: 'Contado', cuit: '30-11223344-7' },
  { cod_cliente: '004', razon_social: 'Buffet Escuela Primaria N°12', domicilio: 'Las Flores 321', condicion_venta: '15 días', cuit: '30-44332211-5' },
  { cod_cliente: '005', razon_social: 'Hotel Central', domicilio: '9 de Julio 567', condicion_venta: '30 días', cuit: '30-55667788-1' },
  { cod_cliente: '006', razon_social: 'Panadería La Espiga de Oro', domicilio: 'Rivadavia 890', condicion_venta: 'Contado', cuit: '20-33445566-8' },
  { cod_cliente: '007', razon_social: 'Restaurante El Rincón', domicilio: 'Colón 234', condicion_venta: '15 días', cuit: '30-77889900-2' },
  { cod_cliente: '008', razon_social: 'Distribuidora Norte SRL', domicilio: 'Corrientes 111', condicion_venta: '60 días', cuit: '30-99001122-4' },
  { cod_cliente: '009', razon_social: 'Cooperativa de Consumo', domicilio: 'Independencia 400', condicion_venta: '30 días', cuit: '30-22334455-6' },
  { cod_cliente: '010', razon_social: 'Kiosco y Almacén Ramírez', domicilio: 'Tucumán 678', condicion_venta: 'Contado', cuit: '20-66778899-0' },
]

const IVA = 0.21
const productos = [
  { cod_articulo: 'Q001', denominacion: 'Queso Cremoso x kg', unidad_medida: 'kg', precio_neto: 1800, precio_con_iva: parseFloat((1800 * (1 + IVA)).toFixed(2)), categoria: 'Quesos' },
  { cod_articulo: 'Q002', denominacion: 'Queso Mozzarella x kg', unidad_medida: 'kg', precio_neto: 2100, precio_con_iva: parseFloat((2100 * (1 + IVA)).toFixed(2)), categoria: 'Quesos' },
  { cod_articulo: 'Q003', denominacion: 'Queso Sardo x kg', unidad_medida: 'kg', precio_neto: 2400, precio_con_iva: parseFloat((2400 * (1 + IVA)).toFixed(2)), categoria: 'Quesos' },
  { cod_articulo: 'Q004', denominacion: 'Queso Mar del Plata x kg', unidad_medida: 'kg', precio_neto: 2200, precio_con_iva: parseFloat((2200 * (1 + IVA)).toFixed(2)), categoria: 'Quesos' },
  { cod_articulo: 'M001', denominacion: 'Manteca x 200g', unidad_medida: 'unid', precio_neto: 850, precio_con_iva: parseFloat((850 * (1 + IVA)).toFixed(2)), categoria: 'Manteca' },
  { cod_articulo: 'M002', denominacion: 'Manteca x 500g', unidad_medida: 'unid', precio_neto: 1900, precio_con_iva: parseFloat((1900 * (1 + IVA)).toFixed(2)), categoria: 'Manteca' },
  { cod_articulo: 'Y001', denominacion: 'Yogur Natural x 190g', unidad_medida: 'unid', precio_neto: 320, precio_con_iva: parseFloat((320 * (1 + IVA)).toFixed(2)), categoria: 'Yogures' },
  { cod_articulo: 'Y002', denominacion: 'Yogur Frutado x 190g', unidad_medida: 'unid', precio_neto: 340, precio_con_iva: parseFloat((340 * (1 + IVA)).toFixed(2)), categoria: 'Yogures' },
  { cod_articulo: 'Y003', denominacion: 'Yogur Entero x 1kg', unidad_medida: 'unid', precio_neto: 1400, precio_con_iva: parseFloat((1400 * (1 + IVA)).toFixed(2)), categoria: 'Yogures' },
  { cod_articulo: 'L001', denominacion: 'Leche Entera x 1L', unidad_medida: 'unid', precio_neto: 550, precio_con_iva: parseFloat((550 * (1 + IVA)).toFixed(2)), categoria: 'Leche' },
  { cod_articulo: 'L002', denominacion: 'Leche Descremada x 1L', unidad_medida: 'unid', precio_neto: 580, precio_con_iva: parseFloat((580 * (1 + IVA)).toFixed(2)), categoria: 'Leche' },
  { cod_articulo: 'C001', denominacion: 'Crema de Leche x 200ml', unidad_medida: 'unid', precio_neto: 680, precio_con_iva: parseFloat((680 * (1 + IVA)).toFixed(2)), categoria: 'Cremas' },
  { cod_articulo: 'C002', denominacion: 'Crema de Leche x 500ml', unidad_medida: 'unid', precio_neto: 1500, precio_con_iva: parseFloat((1500 * (1 + IVA)).toFixed(2)), categoria: 'Cremas' },
  { cod_articulo: 'C004', denominacion: 'Dulce de Leche Repostero x 500g', unidad_medida: 'unid', precio_neto: 1100, precio_con_iva: parseFloat((1100 * (1 + IVA)).toFixed(2)), categoria: 'Cremas' },
]

let contadorComprobante = 1

export const mockApi = {
  clientes: {
    buscar: async (termino) => {
      await new Promise((r) => setTimeout(r, 100))
      if (!termino) return clientes
      const t = termino.toLowerCase()
      return clientes.filter(
        (c) =>
          c.razon_social.toLowerCase().includes(t) ||
          c.cod_cliente.includes(t)
      )
    },
  },
  productos: {
    buscar: async (termino) => {
      await new Promise((r) => setTimeout(r, 100))
      const t = termino.toLowerCase()
      return productos.filter(
        (p) =>
          p.denominacion.toLowerCase().includes(t) ||
          p.categoria.toLowerCase().includes(t)
      )
    },
    porCategoria: async (categoria) => {
      await new Promise((r) => setTimeout(r, 80))
      if (!categoria || categoria === 'Todos') return productos
      return productos.filter((p) => p.categoria === categoria)
    },
  },
  comprobantes: {
    emitir: async ({ cliente, items, totales }) => {
      await new Promise((r) => setTimeout(r, 300))
      const numero = String(contadorComprobante++).padStart(8, '0')
      return { id: contadorComprobante, numero }
    },
    ultimoNumero: async () => contadorComprobante,
  },
}
