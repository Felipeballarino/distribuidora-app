import { formatearPrecio, formatearFecha } from './utils'
import { precioDeItem, subtotalItem, textoCantidad, textoKg, sufijoUnidad, totalComprobante } from './pedido'

// Evita que un nombre con < o & rompa el HTML de la boleta
const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

function htmlCopia(comprobante, empresa, tipo) {
  const itemsHtml = comprobante.items.map((item) => `
      <tr>
        <td>${esc(item.denominacion)}</td>
        <td class="tc mono">${textoCantidad(item)}</td>
        <td class="tc mono">${textoKg(item)}</td>
        <td class="tr mono">${formatearPrecio(precioDeItem(item))}${sufijoUnidad(item)}</td>
        <td class="tr mono bold">${formatearPrecio(subtotalItem(item))}</td>
      </tr>`).join('')

  const total = totalComprobante(comprobante)

  const nombreEmpresa = empresa.razon_social || empresa.nombre || 'Distribuidora'

  return `
  <div class="copia">
    <div class="header">
      <div class="empresa">${esc(nombreEmpresa)}</div>
      ${empresa.cuit ? `<div class="dato">CUIT: ${esc(empresa.cuit)}</div>` : ''}
      ${empresa.ubicacion ? `<div class="dato">${esc(empresa.ubicacion)}</div>` : ''}
      <div class="dato">${formatearFecha(comprobante.fecha || new Date())}</div>
      <div class="header-nro">
        <div class="tipo">PEDIDO · ${tipo}</div>
        <div class="nro">N° ${comprobante.numero}</div>
      </div>
    </div>

    <div class="bloque">
      <div class="titulo">Cliente</div>
      <div class="grilla">
        <div><div class="lbl">Razón Social</div><div class="val">${esc(comprobante.razon_social) || '—'}</div></div>
        <div><div class="lbl">CUIT</div><div class="val mono">${esc(comprobante.cuit) || '—'}</div></div>
        ${comprobante.domicilio ? `<div><div class="lbl">Domicilio</div><div class="val">${esc(comprobante.domicilio)}</div></div>` : ''}
      </div>
    </div>

    <div class="bloque">
      <div class="titulo">Detalle</div>
      <table>
        <thead>
          <tr>
            <th style="width:34%">Producto</th><th class="tc" style="width:9%">Cant.</th>
            <th class="tc" style="width:15%">Kg</th><th class="tr" style="width:21%">Precio</th>
            <th class="tr" style="width:21%">Subt.</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
    </div>

    <div class="totales">
      <div class="total-final">
        <span>Total</span>
        <span class="mono">${formatearPrecio(total)}</span>
      </div>
    </div>
    <div class="leyenda">Documento no válido como factura</div>
  </div>`
}

const CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: 120mm 250mm; margin: 5mm 4mm; }
  body { font-family: Arial, sans-serif; font-size: 9px; color: #111827; }
  .copia { width: 100%; page-break-after: always; }
  .copia:last-child { page-break-after: auto; }
  .header { border-bottom: 2px solid #1a56db; padding-bottom: 6px; margin-bottom: 8px; }
  .empresa { font-size: 12px; font-weight: 900; color: #1a56db; }
  .dato { color: #6b7280; font-size: 8px; margin-top: 1px; }
  .header-nro { display: flex; justify-content: space-between; align-items: center; margin-top: 5px; }
  .tipo { display: inline-block; background: #1a56db; color: #fff;
          padding: 2px 6px; border-radius: 3px; font-size: 8px; font-weight: 900;
          letter-spacing: .05em; }
  .nro { font-family: 'Courier New', monospace; font-size: 12px; font-weight: 900; color: #1a56db; }
  .bloque { margin: 6px 0; }
  .titulo { font-size: 7px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em;
            color: #6b7280; border-bottom: 1px solid #e5e7eb; padding-bottom: 2px; margin-bottom: 4px; }
  .grilla { display: flex; flex-direction: column; gap: 4px;
            background: #f9fafb; padding: 6px; border-radius: 4px; }
  .lbl { font-size: 7px; color: #6b7280; font-weight: 700; }
  .val { font-size: 9px; font-weight: 600; word-break: break-word; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  th { background: #f9fafb; padding: 3px 2px; font-size: 7px; font-weight: 700;
       text-transform: uppercase; color: #6b7280; text-align: left; }
  td { padding: 3px 2px; font-size: 8px; border-bottom: 1px solid #f3f4f6; word-break: break-word; }
  .tc { text-align: center; }
  .tr { text-align: right; }
  .mono { font-family: 'Courier New', monospace; }
  .bold { font-weight: 700; }
  .totales { background: #f9fafb; padding: 5px 8px; border-radius: 4px; margin-top: 5px; }
  .leyenda { margin-top: 6px; text-align: center; font-size: 8px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: .05em; }
  .total-final { display: flex; justify-content: space-between; font-size: 12px; font-weight: 900; }
`

export function imprimirRemito(comprobante, empresa = {}) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Pedido N° ${comprobante.numero}</title>
  <style>${CSS}</style>
</head>
<body>
  ${htmlCopia(comprobante, empresa, 'ORIGINAL')}
  ${htmlCopia(comprobante, empresa, 'DUPLICADO')}
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html; charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:120mm;height:250mm;border:none;visibility:hidden;'

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
