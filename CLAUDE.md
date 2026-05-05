# CLAUDE.md — Sistema de Carga Rápida de Pedidos
## Distribuidora de Lácteos y Alimentos

---

## Descripción del Proyecto

App de escritorio para Windows construida con **Electron + React + Node.js** que permite a operadores cargar pedidos de forma rápida e intuitiva, sin necesidad de usar el ERP (Tango Gestión) directamente.

El operador busca un cliente, selecciona productos con cantidades en kg/unidades, y emite el comprobante. El sistema se conecta a la base de datos existente de Tango (SQL Server) para leer clientes y productos, y escribe los comprobantes generados.

**Usuario objetivo:** Operador con poca experiencia informática, carga 40-60 clientes por día.

---

## Stack Tecnológico

| Capa | Tecnología | Motivo |
|------|-----------|--------|
| Desktop shell | Electron 28+ | App nativa Windows, distribuible como .exe |
| UI | React 18 + Vite | Pantallas rápidas y reactivas |
| Estilos | Tailwind CSS v3 | Clases utilitarias, diseño consistente |
| Componentes | shadcn/ui | Componentes accesibles y profesionales |
| Iconos | Lucide React | Iconos claros y modernos |
| Animaciones | Framer Motion | Transiciones suaves entre pasos |
| Base de datos | better-sqlite3 / mssql | SQLite local para dev, SQL Server para Tango |
| PDF | @react-pdf/renderer | Generación de remitos y comprobantes |
| Estado global | Zustand | Store simple sin boilerplate |
| Formularios | React Hook Form + Zod | Validación robusta de datos |

---

## Estructura de Carpetas

```
distribuidora-app/
├── electron/
│   ├── main.js              # Proceso principal de Electron
│   ├── preload.js           # Bridge seguro entre Electron y React
│   └── db/
│       ├── connection.js    # Conexión a SQL Server (Tango)
│       ├── clientes.js      # Queries de clientes
│       ├── productos.js     # Queries de productos y precios
│       └── comprobantes.js  # Inserción de comprobantes
├── src/
│   ├── main.jsx             # Entry point React
│   ├── App.jsx              # Router principal
│   ├── components/
│   │   ├── ui/              # Componentes base (shadcn)
│   │   ├── BuscadorCliente/ # Paso 1: búsqueda de cliente
│   │   ├── SelectorProducto/ # Paso 2: productos y cantidades
│   │   ├── ResumenPedido/   # Paso 3: resumen y confirmación
│   │   └── ComprobanteEmitido/ # Pantalla de éxito
│   ├── store/
│   │   └── pedidoStore.js   # Estado global del pedido actual
│   ├── hooks/
│   │   ├── useClientes.js   # Hook para buscar clientes
│   │   └── useProductos.js  # Hook para buscar productos
│   └── lib/
│       ├── utils.js         # Helpers (formato de precios, fechas)
│       └── pdf.js           # Generador de PDF de comprobante
├── public/
│   └── assets/              # Logo empresa, fuentes
├── package.json
├── vite.config.js
├── tailwind.config.js
└── electron-builder.json    # Config para generar el .exe instalador
```

---

## Flujo Principal de la App (MVP)

### Paso 1 — Buscar Cliente
- Input grande y prominente con autocompletado en tiempo real
- Búsqueda por nombre o número de cliente
- Navegación con teclado (flechas + Enter)
- Al seleccionar → muestra nombre, dirección y condición de venta
- Mínimo 2 caracteres para activar búsqueda

### Paso 2 — Elegir Productos
- Campo de búsqueda por nombre, marca o categoría
- Filtros rápidos por categoría (Quesos, Manteca, Yogures, Leche, Cremas)
- Cada producto muestra: nombre, precio actualizado, unidad (kg/unid)
- Al seleccionar un producto: control de cantidad con botones +/− grandes
- Precio actualizado viene de la tabla de precios propia (no la de Tango)
- Botón "Agregar" añade el ítem al pedido
- Puede agregar múltiples productos antes de continuar

### Paso 3 — Resumen y Emisión
- Lista clara con todos los ítems: producto, cantidad, precio unitario, subtotal
- Totales: neto gravado, IVA (21%), total final
- Botón para eliminar ítems individuales
- Botón "Emitir comprobante" — genera el número correlativo y registra

### Pantalla de Éxito
- Confirmación visual clara con número de comprobante
- Opción de imprimir remito directamente
- Botón "Nuevo pedido" — limpia todo y vuelve al Paso 1

---

## Base de Datos

### Tablas de Tango a consumir (solo lectura)
```sql
-- Clientes
SELECT 
  cod_cliente,
  razon_social,
  domicilio,
  condicion_venta,
  cuit
FROM tango.clientes
WHERE activo = 1

-- Productos  
SELECT
  cod_articulo,
  denominacion,
  unidad_medida,
  stock_actual
FROM tango.articulos
WHERE activo = 1
```

### Tabla propia de precios (escribir en SQLite local)
```sql
CREATE TABLE precios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cod_articulo TEXT NOT NULL,
  precio_neto DECIMAL(10,2) NOT NULL,
  precio_con_iva DECIMAL(10,2) NOT NULL,
  categoria TEXT,
  activo INTEGER DEFAULT 1,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla de pedidos emitidos (SQLite local)
```sql
CREATE TABLE comprobantes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero TEXT NOT NULL,
  cod_cliente TEXT NOT NULL,
  razon_social TEXT NOT NULL,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  total_neto DECIMAL(10,2),
  total_iva DECIMAL(10,2),
  total_final DECIMAL(10,2),
  items TEXT -- JSON con el detalle
);
```

---

## Principios de Diseño de la Interfaz

El diseño debe seguir estos principios sin excepción:

### Para el operador de 45 años
- **Texto grande:** mínimo 16px en todo, 22px+ en inputs principales
- **Botones grandes:** mínimo 44px de alto, fáciles de hacer clic
- **Un solo foco visual por pantalla:** el usuario nunca duda dónde mirar
- **Confirmación clara:** cada acción importante tiene feedback visual inmediato
- **Sin menús escondidos:** todo lo necesario está visible en pantalla

### Palette de colores
```
Primario:   #1a56db  (azul confiable)
Secundario: #057a55  (verde confirmación)
Peligro:    #e02424  (rojo eliminar)
Fondo:      #f9fafb  (gris muy claro)
Superficie: #ffffff  (blanco)
Texto:      #111827  (casi negro)
Texto suave:#6b7280  (gris medio)
```

### Tipografía
```
Font principal: 'Nunito' (Google Fonts) — redondeada, amigable, muy legible
Font monospace: 'JetBrains Mono' — para números de comprobante y precios
```

### Animaciones
- Transición entre pasos: slide horizontal suave (300ms ease)
- Aparición de items en lista: fade + slide up con stagger
- Botón agregar: feedback de escala al hacer click
- Pantalla de éxito: animación de check mark

---

## Configuración del Entorno

### Requisitos
- Node.js 20+
- npm 10+
- Windows 10/11 (para producción)
- Acceso a red local donde corre SQL Server de Tango

### Instalación inicial
```bash
npm create vite@latest distribuidora-app -- --template react
cd distribuidora-app
npm install

# Electron
npm install --save-dev electron electron-builder concurrently wait-on

# UI y estilos
npm install tailwindcss @tailwindcss/forms postcss autoprefixer
npm install @radix-ui/react-dialog @radix-ui/react-popover
npm install lucide-react framer-motion

# Estado y formularios
npm install zustand react-hook-form zod @hookform/resolvers

# Base de datos
npm install better-sqlite3
npm install --save-dev @types/better-sqlite3

# PDF
npm install @react-pdf/renderer

# Inicializar Tailwind
npx tailwindcss init -p
```

### Variables de entorno (.env)
```env
TANGO_DB_HOST=192.168.1.x
TANGO_DB_PORT=1433
TANGO_DB_NAME=tango_empresa
TANGO_DB_USER=usuario
TANGO_DB_PASSWORD=password
LOCAL_DB_PATH=./data/distribuidora.db
EMPRESA_NOMBRE=Roberto Rojas
EMPRESA_CUIT=XX-XXXXXXXX-X
EMPRESA_DIRECCION=Casa Central
```

---

## Scripts package.json

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:vite\" \"npm run dev:electron\"",
    "dev:vite": "vite",
    "dev:electron": "wait-on http://localhost:5173 && electron .",
    "build": "vite build && electron-builder",
    "build:win": "electron-builder --win --x64"
  }
}
```

---

## Reglas para Claude Code

### Al generar componentes
- Usar siempre componentes funcionales con TypeScript o JSX moderno
- Props bien tipadas y con valores por defecto donde corresponda
- Cada componente en su propia carpeta con index.jsx
- Separar la lógica en custom hooks, no mezclar con el JSX

### Al escribir queries
- Usar parámetros preparados siempre, nunca interpolación de strings
- Manejar errores de conexión con fallback a datos locales
- Logear errores en archivo local para diagnóstico

### Al estilizar
- Usar clases de Tailwind, evitar CSS custom salvo excepciones
- Seguir la paleta definida arriba usando variables CSS
- Mobile-first no aplica aquí — diseñar para pantalla de 1366x768 mínimo

### Al generar PDFs
- Usar @react-pdf/renderer
- Formato A4 vertical para remitos
- Incluir siempre: logo empresa, número correlativo, fecha, cliente, detalle de ítems, totales, pie con datos fiscales

### Código limpio
- Comentarios en español (el cliente puede leer el código)
- Nombres de variables y funciones en español o inglés, consistente
- Un archivo por componente/hook/utilidad

---

## MVP — Alcance de la Primera Versión

### Incluido ✓
- Búsqueda y selección de cliente
- Búsqueda y selección de productos con cantidad en kg/unidades
- Lista de precios propia independiente de Tango
- Resumen del pedido con totales (neto + IVA)
- Emisión de comprobante con número correlativo
- Pantalla de confirmación
- Conexión a base de datos local SQLite (para demo sin Tango)

### Excluido del MVP ✗
- Integración real con Tango (siguiente fase)
- Impresión de remito (siguiente fase)
- WhatsApp automático (siguiente fase)
- Hoja de ruta del chofer (siguiente fase)
- App del chofer en celular (siguiente fase)

---

## Cómo iniciar el desarrollo

```bash
# 1. Clonar o crear el proyecto
npm create vite@latest distribuidora-app -- --template react
cd distribuidora-app

# 2. Instalar dependencias (ver sección de instalación)

# 3. Crear datos de prueba en SQLite local
node scripts/seed.js

# 4. Levantar en modo desarrollo
npm run dev

# 5. Para generar el instalador .exe
npm run build:win
```

El primer archivo a crear es `electron/main.js` seguido de `src/store/pedidoStore.js` y luego los componentes en orden del flujo: `BuscadorCliente` → `SelectorProducto` → `ResumenPedido` → `ComprobanteEmitido`.