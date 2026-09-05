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
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character] ?? character);

export async function generarPresupuestoPDF(data: PresupuestoPDFData) {
  const hoja = document.createElement('article');
  hoja.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;min-height:1123px;padding:64px;background:#ffffff;color:#18221d;font-family:Arial,sans-serif;box-sizing:border-box;';
  hoja.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #d5e1c0;padding-bottom:28px;"><div><p style="margin:0 0 10px;color:#e1643c;font-size:14px;font-weight:700;letter-spacing:3px;">CARPER / ESTUDIO DIGITAL</p><h1 style="margin:0;font-size:34px;line-height:1.1;">${escapeHtml(data.titulo ?? 'Presupuesto de servicios')}</h1></div>${data.logo ? `<img src="${data.logo}" alt="Logo" style="width:76px;height:76px;object-fit:contain;" />` : '<div style="width:76px;height:76px;border-radius:18px;background:#20251f;"></div>'}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:42px;padding:22px 0;border-bottom:1px solid #dfe5da;"><div><p style="margin:0 0 8px;color:#687064;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Preparado para</p><p style="margin:0;font-size:20px;font-weight:700;">${escapeHtml(data.cliente)}</p></div><div><p style="margin:0 0 8px;color:#687064;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Fecha de emisión</p><p style="margin:0;font-size:20px;font-weight:700;">${escapeHtml(data.fecha)}</p></div></div><div style="margin-top:44px;"><p style="margin:0 0 12px;color:#687064;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Alcance propuesto</p><h2 style="margin:0 0 14px;font-size:25px;">${escapeHtml(data.servicio)}</h2><p style="margin:0;color:#526048;font-size:16px;line-height:1.7;white-space:pre-line;">${escapeHtml(data.descripcion)}</p></div><div style="margin-top:90px;padding:26px 30px;background:#f1f5ea;border-radius:18px;display:flex;justify-content:space-between;align-items:center;"><div><p style="margin:0 0 8px;color:#687064;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Inversión estimada</p><p style="margin:0;font-size:32px;font-weight:700;">${escapeHtml(data.moneda ?? 'USD')} ${data.total.toFixed(2)}</p></div><div style="text-align:right;color:#526048;font-size:13px;">${escapeHtml(data.vigencia ?? 'Vigencia: 7 días')}<br />Sujeto a alcance final</div></div><div style="margin-top:100px;padding-top:18px;border-top:1px solid #dfe5da;color:#687064;font-size:12px;line-height:1.5;">Gracias por considerar a CARPER para tu próximo proyecto.</div>`;

  document.body.appendChild(hoja);
  try {
    const canvas = await html2canvas(hoja, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imageWidth = pageWidth;
    const imageHeight = (canvas.height * imageWidth) / canvas.width;
    let offset = 0;
    while (offset < imageHeight) {
      if (offset > 0) pdf.addPage();
      pdf.addImage(canvas, 'PNG', 0, -offset, imageWidth, imageHeight, undefined, 'FAST');
      offset += pageHeight;
    }
    pdf.save(`Presupuesto_${data.cliente.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
  } finally {
    hoja.remove();
  }
}