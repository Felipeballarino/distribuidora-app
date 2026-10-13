// API simulada para desarrollo en el navegador (sin Electron)
let clientes = [
  { id: 1, cod_cliente: '001', razon_social: 'Supermercado El Ahorro', domicilio: 'Av. San Martín 1234', localidad: 'Villa María', telefono: '2664123456', email: '', cuit: '30-12345678-9' },
  { id: 2, cod_cliente: '002', razon_social: 'Almacén Don Pedro', domicilio: 'Belgrano 456', localidad: 'Villa Mercedes', telefono: '2657456789', email: '', cuit: '20-87654321-3' },
  { id: 3, cod_cliente: '003', razon_social: 'Minimarket La Esquina', domicilio: 'Mitre 789', localidad: 'Villa María', telefono: '', email: '', cuit: '30-11223344-7' },
  { id: 4, cod_cliente: '004', razon_social: 'Buffet Escuela Primaria N°12', domicilio: 'Las Flores 321', localidad: 'La Toma', telefono: '', email: '', cuit: '30-44332211-5' },
  { id: 5, cod_cliente: '005', razon_social: 'Hotel Central', domicilio: '9 de Julio 567', localidad: 'Villa María', telefono: '2664987654', email: 'hotel@central.com', cuit: '30-55667788-1' },
  { id: 6, cod_cliente: '006', razon_social: 'Panadería La Espiga de Oro', domicilio: 'Rivadavia 890', localidad: 'Villa Mercedes', telefono: '2657321654', email: '', cuit: '20-33445566-8' },
  { id: 7, cod_cliente: '007', razon_social: 'Restaurante El Rincón', domicilio: 'Colón 234', localidad: 'Villa María', telefono: '2664555444', email: 'elrincon@mail.com', cuit: '30-77889900-2' },
  { id: 8, cod_cliente: '008', razon_social: 'Distribuidora Norte SRL', domicilio: 'Corrientes 111', localidad: 'San Luis', telefono: '2664111222', email: '', cuit: '30-99001122-4' },
  { id: 9, cod_cliente: '009', razon_social: 'Cooperativa de Consumo', domicilio: 'Independencia 400', localidad: 'Villa María', telefono: '', email: '', cuit: '30-22334455-6' },
  { id: 10, cod_cliente: '010', razon_social: 'Kiosco y Almacén Ramírez', domicilio: 'Tucumán 678', localidad: 'La Toma', telefono: '2657789012', email: '', cuit: '20-66778899-0' },
]

// precio_neto = COSTO. unidad_medida = cómo se cobra. peso_promedio_kg = peso por pieza (opcional)
let productos = [
  { id: 1, cod_articulo: '2', denominacion: 'Queso Barra Don Bosco', marca: 'Don Bosco', unidad_medida: 'kg', peso_promedio_kg: 4.5, precio_neto: 4000, stock: 120, categoria: 'Quesos' },
  { id: 2, cod_articulo: '144', denominacion: 'Queso Barra La Estancia', marca: 'La Estancia', unidad_medida: 'kg', peso_promedio_kg: 4.2, precio_neto: 3800, stock: null, categoria: 'Quesos' },
  { id: 3, cod_articulo: '1', denominacion: 'Queso Cremoso Horma', marca: 'La Quesera', unidad_medida: 'kg', peso_promedio_kg: 3.8, precio_neto: 3500, stock: null, categoria: 'Quesos' },
  { id: 4, cod_articulo: 'Q9', denominacion: 'Queso Cremoso fraccionado', marca: '', unidad_medida: 'kg', peso_promedio_kg: null, precio_neto: 3700, stock: null, categoria: 'Quesos' },
  { id: 5, cod_articulo: '41', denominacion: 'Cheddar líquido x 4 kg', marca: 'La Quesera', unidad_medida: 'unid', peso_promedio_kg: null, precio_neto: 18000, stock: 10, categoria: 'Quesos' },
  { id: 6, cod_articulo: 'F001', denominacion: 'Jamón Cocido pieza', marca: 'Paladini', unidad_medida: 'kg', peso_promedio_kg: 5, precio_neto: 6200, stock: null, categoria: 'Fiambres' },
  { id: 7, cod_articulo: 'F002', denominacion: 'Salame Milán', marca: '', unidad_medida: 'kg', peso_promedio_kg: 1.2, precio_neto: 7800, stock: null, categoria: 'Fiambres' },
  { id: 8, cod_articulo: 'M001', denominacion: 'Manteca x 200 g', marca: 'La Serenísima', unidad_medida: 'unid', peso_promedio_kg: null, precio_neto: 850, stock: null, categoria: 'Manteca' },
  { id: 9, cod_articulo: 'Y001', denominacion: 'Yogur Natural x 190 g', marca: '', unidad_medida: 'unid', peso_promedio_kg: null, precio_neto: 320, stock: null, categoria: 'Yogures' },
  { id: 10, cod_articulo: 'C001', denominacion: 'Crema de Leche x 200 ml', marca: '', unidad_medida: 'unid', peso_promedio_kg: null, precio_neto: 680, stock: null, categoria: 'Cremas' },
  { id: 11, cod_articulo: 'C004', denominacion: 'Dulce de Leche Repostero x 10 kg', marca: '', unidad_medida: 'unid', peso_promedio_kg: null, precio_neto: 21000, stock: 3, categoria: 'Otros' },
]

let nextClienteId = 11
let nextProductoId = 12
let contadorComprobante = 1
let historialComprobantes = []

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
          localidad: String(f['Localidad'] || f.localidad || '').trim(),
          telefono: String(f['Teléfono'] || f['Telefono'] || f.telefono || '').trim(),
          email: String(f['Email'] || f.email || '').trim(),
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
      const norm = (x) => String(x || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const palabras = norm(termino).split(/\s+/).filter(Boolean)
      return productos.filter((p) => {
        const texto = norm(`${p.denominacion} ${p.marca} ${p.categoria} ${p.cod_articulo}`)
        return palabras.every((w) => texto.includes(w))
      })
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
        const unidad = String(f['Unidad'] || f.unidad_medida || 'unid').trim().toLowerCase() === 'kg' ? 'kg' : 'unid'
        const existente = productos.findIndex((p) => p.cod_articulo === cod)
        const nuevo = {
          id: existente >= 0 ? productos[existente].id : nextProductoId++,
          cod_articulo: cod,
          denominacion: den,
          marca: String(f['Marca'] || f.marca || '').trim(),
          unidad_medida: unidad,
          peso_promedio_kg: unidad === 'kg' ? parseFloat(f['Peso promedio'] || f.peso_promedio_kg) || null : null,
          precio_neto: parseFloat(f['Costo'] || f['Precio'] || f.precio_neto || 0),
          stock: f['Stock'] !== undefined && f['Stock'] !== '' ? parseFloat(f['Stock']) : null,
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
      items.forEach((item) => {
        const idx = productos.findIndex((p) => p.cod_articulo === item.cod_articulo)
        if (idx >= 0 && productos[idx].stock != null) {
          productos[idx].stock = productos[idx].stock - item.cantidad
        }
      })
      const numero = String(contadorComprobante++).padStart(8, '0')
      const comprobante = {
        id: contadorComprobante,
        numero,
        cod_cliente: cliente.cod_cliente,
        razon_social: cliente.razon_social,
        cuit: cliente.cuit || '',
        domicilio: cliente.domicilio || '',
        fecha: new Date().toISOString(),
        total_neto: totales.total,
        total_iva: 0,
        total_final: totales.total,
        items,
      }
      historialComprobantes.push(comprobante)
      return { id: contadorComprobante, numero }
    },
    listar: async () => {
      await delay(100)
      return [...historialComprobantes].reverse()
    },
    ultimoNumero: async () => contadorComprobante,
  },
}
