import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface PresupuestoPDFData {
  cliente: string;
  titulo?: string;
  fecha: string;
  servicio: string;
  descripcion: string;
  total: number;
  moneda?: string;
  vigencia?: string;
  logo?: string | null;
  emisor?: {
    nombre?: string;
    razon_social?: string;
    subtitulo?: string;
  };
  documento?: {
    tipo?: string;
    fecha_emision?: string;
    vigencia?: string;
    moneda?: string;
    estado?: string;
  };
  clienteDetalle?: {
    nombre?: string;
    alcance_propuesto?: string;
    descripcion_alcance?: string;
  };
  detalle_servicios?: Array<{
    jornada?: number;
    fecha?: string;
    horas?: number;
    actividades?: string[];
  }>;
  resumen?: {
    total_jornadas?: number;
    total_horas?: number;
    precio_hora_usd?: number;
    inversion_estimada_usd?: number;
  };
  terminos_y_condiciones?: string[];
  pie_de_pagina?: string;
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[character] ?? character);

const renderDetalleServicios = (detalleServicios?: PresupuestoPDFData['detalle_servicios']) => {
  if (!detalleServicios || detalleServicios.length === 0) {
    return `<div style="padding:10px 12px;border:1px solid #e5e7eb;border-radius:10px;background:#f8fafc;color:#475569;font-size:12px;">Sin detalle de servicios registrado.</div>`;
  }

  const filas = detalleServicios.map((servicio, index) => {
    const actividades = servicio.actividades && servicio.actividades.length > 0
      ? servicio.actividades.map((actividad) => `<span style="display:inline-block;max-width:100%;white-space:normal;overflow-wrap:anywhere;background:#f0f0f0;color:#111;border:1px solid #d5d5d5;border-radius:3px;font-size:10px;font-weight:600;padding:2px 5px;margin:1px 2px;">${escapeHtml(actividad)}</span>`).join(' ')
      : '<span style="color:#777;font-style:italic;font-size:10px;">Sin actividades registradas</span>';

    return `<tr>
      <td style="padding:7px 8px;border-bottom:1px solid #e5e7eb;vertical-align:top;font-weight:700;white-space:nowrap;">Jornada ${servicio.jornada ?? index + 1}</td>
      <td style="padding:7px 8px;border-bottom:1px solid #e5e7eb;vertical-align:top;line-height:1.35;overflow-wrap:anywhere;word-break:break-word;">${actividades}</td>
      <td style="padding:7px 8px;border-bottom:1px solid #e5e7eb;vertical-align:top;white-space:nowrap;">${escapeHtml(servicio.fecha ?? 'Fecha no disponible')}</td>
      <td style="padding:7px 8px;border-bottom:1px solid #e5e7eb;vertical-align:top;text-align:right;white-space:nowrap;"><span style="display:inline-block;background:#000;color:#fff;font-weight:700;font-size:10px;padding:3px 7px;border-radius:10px;">${Number(servicio.horas ?? 0)}h</span></td>
    </tr>`;
  }).join('');

  return `<table style="width:100%;max-width:100%;table-layout:fixed;border-collapse:collapse;border:1px solid #d1d5db;font-size:11px;color:#111;overflow-wrap:anywhere;">
    <thead>
      <tr style="background:#000;color:#fff;text-align:left;">
        <th style="width:10%;padding:7px 8px;font-size:9px;text-transform:uppercase;letter-spacing:0.7px;text-align:center;">Jornada</th>
        <th style="width:68%;padding:7px 8px;font-size:9px;text-transform:uppercase;letter-spacing:0.7px;">Descripción de actividades</th>
        <th style="width:12%;padding:7px 8px;font-size:9px;text-transform:uppercase;letter-spacing:0.7px;text-align:center;">Fecha</th>
        <th style="width:10%;padding:7px 8px;font-size:9px;text-transform:uppercase;letter-spacing:0.7px;text-align:right;">Horas</th>
      </tr>
    </thead>
    <tbody>${filas}</tbody>
  </table>`;
};

export async function generarPresupuestoPDF(data: PresupuestoPDFData) {
  const emisor = data.emisor ?? {
    nombre: 'CARPER',
    razon_social: 'CARPER / ESTUDIO DIGITAL',
    subtitulo: 'Marketing & Software Development'
  };

  const documento = data.documento ?? {
    tipo: data.titulo ?? 'Factura de servicios',
    fecha_emision: data.fecha,
    vigencia: data.vigencia ?? '7 días hábiles',
    moneda: data.moneda ?? 'USD',
    estado: 'Sujeto a alcance final'
  };

  const clienteDetalle = data.clienteDetalle ?? {
    nombre: data.cliente,
    alcance_propuesto: data.servicio,
    descripcion_alcance: data.descripcion
  };

  const totalHoras = data.resumen?.total_horas ?? 0;
  const totalJornadas = data.resumen?.total_jornadas ?? (data.detalle_servicios?.length ?? 0);
  const inversionEstimada = data.resumen?.inversion_estimada_usd ?? data.total;
  const logoHtml = data.logo
    ? `<img src="${data.logo}" alt="${escapeHtml(emisor.nombre ?? 'CARPER')}" style="max-height:42px;width:auto;display:block;" />`
    : `<div style="font-size:24px;font-weight:900;letter-spacing:2px;text-transform:uppercase;color:#000;">${escapeHtml(emisor.nombre ?? 'CARPER')}</div>`;

  const hoja = document.createElement('article');
  hoja.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;padding:40px 45px 34px;background:#fff;color:#000;font-family:Arial,Helvetica,sans-serif;box-sizing:border-box;font-size:12px;line-height:1.4;';
  hoja.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:20px;padding-bottom:14px;border-bottom:2px solid #000;margin-bottom:20px;">
      <div style="min-width:0;max-width:52%;overflow:hidden;">
        ${logoHtml}
        <div style="font-size:12px;font-weight:700;color:#111;margin-top:5px;">${escapeHtml(emisor.razon_social ?? 'CARPER / ESTUDIO DIGITAL')}</div>
        <div style="font-size:9px;color:#555;margin-top:2px;">${escapeHtml(emisor.subtitulo ?? 'Marketing & Software Development')}</div>
      </div>
      <div style="min-width:0;max-width:48%;text-align:right;overflow-wrap:anywhere;word-break:break-word;">
        <div style="font-size:9px;color:#555;text-transform:uppercase;letter-spacing:1px;">Documento</div>
        <div style="font-size:18px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#000;margin-top:4px;">${escapeHtml(documento.tipo ?? 'Factura de servicios')}</div>
        <div style="font-size:9px;font-weight:600;color:#555;letter-spacing:0.8px;text-transform:uppercase;margin-top:3px;">${escapeHtml(emisor.razon_social ?? 'CARPER / ESTUDIO DIGITAL')}</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);margin-bottom:20px;">
      <div style="min-width:0;overflow-wrap:anywhere;padding:12px 16px;background:#fafafa;border:1px solid #d9d9d9;border-right:0;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#555;margin-bottom:5px;">Preparado para</div>
        <div style="font-size:16px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:#000;margin-bottom:7px;">${escapeHtml(clienteDetalle.nombre ?? data.cliente)}</div>
        <div style="font-size:11px;color:#333;margin-top:3px;"><strong style="color:#000;">Fecha de emisión:</strong> ${escapeHtml(documento.fecha_emision ?? data.fecha)}</div>
        <div style="font-size:11px;color:#333;margin-top:3px;"><strong style="color:#000;">Vigencia:</strong> ${escapeHtml(documento.vigencia ?? '7 días hábiles')}</div>
      </div>
      <div style="min-width:0;overflow-wrap:anywhere;padding:12px 16px;background:#fafafa;border:1px solid #d9d9d9;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#555;margin-bottom:5px;">Alcance propuesto</div>
        <div style="font-size:13px;font-weight:700;color:#111;margin-bottom:4px;">${escapeHtml(clienteDetalle.alcance_propuesto ?? data.servicio)}</div>
        <div style="font-size:11px;color:#333;line-height:1.35;">${escapeHtml(clienteDetalle.descripcion_alcance ?? data.descripcion)}</div>
        <div style="font-size:11px;color:#333;margin-top:5px;"><strong style="color:#000;">Condición:</strong> ${escapeHtml(documento.estado ?? 'Sujeto a alcance final')}</div>
      </div>
    </div>

    <div style="font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#000;margin:16px 0 8px;padding-bottom:4px;border-bottom:1.5px solid #000;">Detalle de servicios realizados</div>
    <div>
      ${renderDetalleServicios(data.detalle_servicios)}
    </div>

    <div style="display:flex;justify-content:flex-end;margin-top:10px;">
      <div style="width:42%;max-width:100%;background:#000;color:#fff;padding:14px 16px;text-align:right;border-radius:4px;overflow-wrap:anywhere;">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#ccc;margin-bottom:3px;font-weight:700;">Total</div>
        <div style="font-size:24px;font-weight:800;line-height:1.1;margin-bottom:5px;">${escapeHtml(documento.moneda ?? 'USD')} ${Number(inversionEstimada).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <div style="font-size:10px;color:#aaa;text-transform:uppercase;letter-spacing:0.8px;">Total ${totalHoras} horas (${totalJornadas} jornadas)</div>
      </div>
    </div>

    <div style="margin-top:22px;padding-top:12px;border-top:1px dashed #ccc;text-align:center;color:#333;font-size:10px;font-weight:500;letter-spacing:0.2px;">
      ${escapeHtml(data.pie_de_pagina ?? 'Gracias por considerar a CARPER para tu próximo proyecto.')}
    </div>
  `;

  document.body.appendChild(hoja);

  try {
    const canvas = await html2canvas(hoja, { scale: 1, backgroundColor: '#ffffff', useCORS: true });
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const scale = Math.min(pageWidth / canvas.width, pageHeight / canvas.height, 1);

    pdf.addImage(canvas, 'PNG', 0, 0, canvas.width * scale, canvas.height * scale, undefined, 'FAST');

    const nombreArchivo = (data.titulo ?? 'Factura')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    pdf.save(`${nombreArchivo}_${data.cliente.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
  } finally {
    hoja.remove();
  }
}
