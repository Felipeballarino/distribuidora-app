import { formatearPrecio, formatearFecha } from './utils.js'
import { precioDeItem, subtotalItem, textoCantidad, textoKg, sufijoUnidad, totalComprobante, redondear } from './pedido.js'

// BOLETA EN A4 CON TROQUEL AL MEDIO
// Cada hoja A4 tiene dos mitades iguales: arriba el ORIGINAL y abajo el DUPLICADO.
// Se corta por el troquel: una mitad queda para la distribuidora y la otra para el cliente.
// Si los productos no entran en una mitad, se usan más hojas (cada una con su original y duplicado):
// las hojas intermedias dicen "Sigue en la hoja siguiente" y el total va en la última.

// Filas de productos que entran en cada mitad. Las filas tienen alto fijo (los nombres largos
// se cortan con "…"), así la cuenta es exacta y nada se pasa del troquel.
export const FILAS_POR_HOJA = 17

// Evita que un nombre con < o & rompa el HTML de la boleta
const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

// Parte los ítems en hojas de `porHoja` filas. Siempre devuelve al menos una hoja.
export function paginarItems(items = [], porHoja = FILAS_POR_HOJA) {
  if (items.length === 0) return [[]]
  const hojas = []
  for (let i = 0; i < items.length; i += porHoja) hojas.push(items.slice(i, i + porHoja))
  return hojas
}

function htmlMitad({ comprobante, empresa, copia, items, hoja, totalHojas }) {
  const nombreEmpresa = empresa.nombre || empresa.razon_social || 'Distribuidora'
  const esUltima = hoja === totalHojas
  const sumaHoja = redondear(items.reduce((acc, i) => acc + subtotalItem(i), 0))
  const cliente = [
    comprobante.cod_cliente ? `<span class="mono">#${esc(comprobante.cod_cliente)}</span>` : '',
    `<b>${esc(comprobante.razon_social) || '—'}</b>`,
  ].filter(Boolean).join(' ')
  const datosCliente = [
    comprobante.domicilio ? esc(comprobante.domicilio) : '',
    comprobante.cuit ? `CUIT ${esc(comprobante.cuit)}` : '',
  ].filter(Boolean).join(' · ')

  const filas = items.map((item) => `
        <tr>
          <td class="prod">${esc(item.denominacion)}</td>
          <td class="tc">${textoCantidad(item)}</td>
          <td class="tc">${textoKg(item)}</td>
          <td class="tr">${formatearPrecio(precioDeItem(item))}<span class="suf">${sufijoUnidad(item)}</span></td>
          <td class="tr b">${formatearPrecio(subtotalItem(item))}</td>
        </tr>`).join('')

  return `
    <section class="mitad">
      <header>
        <div class="emp">
          <div class="emp-nombre">${esc(nombreEmpresa)}</div>
          ${empresa.razon_social && empresa.razon_social !== nombreEmpresa ? `<div>${esc(empresa.razon_social)}</div>` : ''}
          ${empresa.cuit ? `<div>CUIT ${esc(empresa.cuit)}</div>` : ''}
          ${empresa.ubicacion ? `<div>${esc(empresa.ubicacion)}</div>` : ''}
        </div>
        <div class="comp">
          <div class="comp-tipo">PEDIDO <span class="copia">${copia}</span></div>
          <div class="comp-nro">N° ${esc(comprobante.numero)}</div>
          <div>${formatearFecha(comprobante.fecha || new Date())}</div>
          ${totalHojas > 1 ? `<div class="hoja">Hoja ${hoja} de ${totalHojas}</div>` : ''}
        </div>
      </header>

      <div class="cliente">
        <span class="lbl">Cliente</span> ${cliente}
        ${datosCliente ? `<span class="datos">${datosCliente}</span>` : ''}
      </div>

      <table>
        <colgroup>
          <col style="width:47%"><col style="width:9%"><col style="width:12%"><col style="width:16%"><col style="width:16%">
        </colgroup>
        <thead>
          <tr><th>Producto</th><th class="tc">Cant.</th><th class="tc">Kg</th><th class="tr">Precio</th><th class="tr">Subtotal</th></tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>

      <footer>
        <div class="leyenda">Documento no válido como factura</div>
        ${esUltima
          ? `<div class="total"><span>TOTAL</span><span>${formatearPrecio(totalComprobante(comprobante))}</span></div>`
          : `<div class="sigue">Suma de esta hoja ${formatearPrecio(sumaHoja)} · <b>Sigue en la hoja ${hoja + 1}</b></div>`}
      </footer>
    </section>`
}

// HTML completo de la boleta (se puede probar sin imprimir)
export function htmlBoleta(comprobante, empresa = {}) {
  const hojas = paginarItems(comprobante.items)
  const cuerpo = hojas.map((items, i) => {
    const datos = { comprobante, empresa, items, hoja: i + 1, totalHojas: hojas.length }
    return `
  <div class="pagina">
    ${htmlMitad({ ...datos, copia: 'ORIGINAL' })}
    ${htmlMitad({ ...datos, copia: 'DUPLICADO' })}
  </div>`
  }).join('')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Pedido N° ${esc(comprobante.numero)}</title>
  <style>${CSS}</style>
</head>
<body>${cuerpo}
</body>
</html>`
}

// Medidas en mm. Mitad = 148,5 mm (A4 / 2). Las impresoras no imprimen en los ~4 mm del borde,
// por eso el margen interno es de 8 mm.
const CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: A4 portrait; margin: 0; }
  html, body { width: 210mm; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 9pt; color: #000;
         -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .pagina { width: 210mm; height: 297mm; overflow: hidden; page-break-after: always; break-after: page; }
  .pagina:last-child { page-break-after: auto; break-after: auto; }
  .mitad { height: 148.5mm; padding: 8mm 11mm 7mm; display: flex; flex-direction: column; overflow: hidden; }
  /* línea guía sobre el troquel */
  .mitad + .mitad { border-top: 0.2mm dashed #9ca3af; }

  header { display: flex; justify-content: space-between; align-items: flex-start; gap: 6mm;
           height: 20mm; border-bottom: 0.5mm solid #000; padding-bottom: 2mm; }
  .emp { font-size: 8pt; color: #374151; line-height: 1.35; min-width: 0; }
  .emp-nombre { font-size: 13pt; font-weight: 700; color: #000; line-height: 1.15; margin-bottom: 0.5mm;
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .comp { text-align: right; font-size: 8pt; color: #374151; line-height: 1.35; white-space: nowrap; }
  .comp-tipo { font-size: 8pt; font-weight: 700; letter-spacing: .06em; color: #000; }
  .copia { border: 0.3mm solid #000; padding: 0 1.5mm; margin-left: 1mm; }
  .comp-nro { font-size: 13pt; font-weight: 700; color: #000; margin: 0.5mm 0; }
  .hoja { font-weight: 700; color: #000; }

  .cliente { height: 9mm; display: flex; align-items: center; gap: 2mm; font-size: 9.5pt;
             border-bottom: 0.2mm solid #d1d5db; white-space: nowrap; overflow: hidden; }
  .cliente .lbl { font-size: 7pt; font-weight: 700; text-transform: uppercase; color: #6b7280; letter-spacing: .05em; }
  .cliente .datos { color: #374151; font-size: 8.5pt; overflow: hidden; text-overflow: ellipsis; }
  .cliente .datos::before { content: '·'; margin-right: 2mm; color: #9ca3af; }

  table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: 1.5mm; }
  th { height: 5.5mm; font-size: 7pt; font-weight: 700; text-transform: uppercase; letter-spacing: .04em;
       color: #4b5563; text-align: left; border-bottom: 0.3mm solid #000; padding: 0 1.5mm; }
  td { height: 5.2mm; padding: 0 1.5mm; font-size: 9pt; border-bottom: 0.2mm solid #e5e7eb;
       white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  td.prod { font-weight: 600; }
  .tc { text-align: center; }
  .tr { text-align: right; }
  .b { font-weight: 700; }
  .suf { font-size: 7pt; color: #6b7280; }

  footer { margin-top: auto; display: flex; justify-content: space-between; align-items: flex-end;
           border-top: 0.5mm solid #000; padding-top: 2mm; }
  .leyenda { font-size: 7pt; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #4b5563; }
  .total { display: flex; gap: 6mm; align-items: baseline; font-size: 14pt; font-weight: 700; }
  .total span:first-child { font-size: 9pt; letter-spacing: .06em; }
  .sigue { font-size: 9pt; }
`

export function imprimirRemito(comprobante, empresa = {}) {
  const blob = new Blob([htmlBoleta(comprobante, empresa)], { type: 'text/html; charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:none;visibility:hidden;'

  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow.print()
      setTimeout(() => {
        URL.revokeObjectURL(url)
        document.body.removeChild(iframe)
      }, 500)
    }, 150)
  }

  iframe.src = url
  document.body.appendChild(iframe)
}
