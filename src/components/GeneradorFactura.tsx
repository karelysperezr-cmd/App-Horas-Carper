import React, { useState } from 'react';
import { FileText, Download, Image as ImageIcon, CheckCircle2, Trash2 } from 'lucide-react';
import type { Cliente, RegistroJornada, Factura } from '../types';
import jsPDF from 'jspdf';

interface GeneradorFacturaProps {
  clientes: Cliente[];
  registros: RegistroJornada[];
  onGuardarFactura: (factura: Factura) => void;
}

export const GeneradorFactura: React.FC<GeneradorFacturaProps> = ({
  clientes,
  registros,
  onGuardarFactura
}) => {
  const [clienteId, setClienteId] = useState<string>('');
  const [tipoCobroSeleccionado, setTipoCobroSeleccionado] = useState<'hora' | 'contrato'>('hora');
  const [montoContrato, setMontoContrato] = useState<number>(0);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string>('');

  const clienteActual = clientes.find(c => c.id === clienteId);
  const registrosCliente = registros.filter(r => r.clienteId === clienteId && r.completado);

  const totalHorasCalculadas = registrosCliente.reduce((acc, curr) => acc + curr.totalHoras, 0);
  const montoTotal = clienteActual 
    ? (tipoCobroSeleccionado === 'hora' ? totalHorasCalculadas * clienteActual.tarifaHora : montoContrato)
    : 0;

  const handleCargarLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generarPDF = () => {
    if (!clienteActual) return;

    const doc = new jsPDF();
    const fechaActual = new Date().toLocaleDateString();
    let currentY = 20;

    doc.setFillColor(245, 245, 245);
    doc.roundedRect(14, 12, 182, 36, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text('FACTURA DE SERVICIOS', 20, 24);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(82, 82, 91);
    doc.text(`Cliente: ${clienteActual.nombre}`, 20, 32);
    doc.text(`Fecha de emisión: ${fechaActual}`, 20, 39);

    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'JPEG', 160, 15, 24, 24);
      } catch (error) {
        console.error('Error al incrustar logo', error);
      }
    }

    currentY = 56;
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, currentY - 8, 182, 26, 3, 3, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('Datos del cliente', 20, currentY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(82, 82, 91);
    doc.text(`Modalidad: ${tipoCobroSeleccionado === 'hora' ? 'Pago por Hora' : 'Contrato Fijo'}`, 20, currentY + 8);
    doc.text(`Tarifa por Hora: $${clienteActual.tarifaHora}`, 20, currentY + 14);

    currentY = 92;
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, currentY - 8, 182, 16, 3, 3, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('Resumen de jornadas', 20, currentY);

    currentY += 14;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('Fecha', 20, currentY);
    doc.text('Horas', 78, currentY);
    doc.text('Detalle', 112, currentY);
    doc.line(18, currentY + 2, 192, currentY + 2);
    currentY += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);

    registrosCliente.forEach((reg) => {
      if (currentY > 255) {
        doc.addPage();
        currentY = 24;
      }

      const detalle = reg.actividades.length > 0
        ? reg.actividades.map((act) => `${act.tipo.toUpperCase()}: ${act.descripcion}`).join(' | ')
        : 'Sin actividades registradas';
      const textoDetalle = doc.splitTextToSize(detalle, 72);

      doc.text(reg.fecha, 20, currentY);
      doc.text(`${reg.totalHoras}h`, 78, currentY);
      doc.text(textoDetalle[0] || '', 112, currentY);
      currentY += Math.max(6, textoDetalle.length * 4.5);
    });

    currentY += 8;
    if (currentY > 255) {
      doc.addPage();
      currentY = 24;
    }

    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.5);
    doc.line(18, currentY, 192, currentY);
    currentY += 10;

    doc.setFillColor(249, 250, 251);
    doc.roundedRect(14, currentY - 6, 182, 28, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    if (tipoCobroSeleccionado === 'hora') {
      doc.text(`Total Horas: ${totalHorasCalculadas} hrs`, 20, currentY);
      doc.text(`Monto Total: $${montoTotal.toFixed(2)}`, 20, currentY + 8);
    } else {
      doc.text(`Monto por Contrato: $${montoTotal.toFixed(2)}`, 20, currentY + 4);
    }

    doc.save(`Factura_${clienteActual.nombre.replace(/\s+/g, '_')}_${Date.now()}.pdf`);

    const nuevaFactura: Factura = {
      id: Date.now().toString(),
      clienteId,
      fechaEmision: fechaActual,
      registrosIds: registrosCliente.map((r) => r.id),
      totalHoras: totalHorasCalculadas,
      montoTotal,
      tipoCobro: tipoCobroSeleccionado
    };
    onGuardarFactura(nuevaFactura);

    setMensajeExito('¡Factura generada y descargada con éxito!');
    setTimeout(() => setMensajeExito(''), 4000);
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded-3xl border border-neutral-200 shadow-sm my-2 space-y-4">
      <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
        <FileText className="text-black" /> Generador de Facturas PDF
      </h2>

      {mensajeExito && (
        <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 size={16} /> {mensajeExito}
        </div>
      )}

      <div className="p-3 bg-neutral-50 rounded-2xl border border-dashed border-neutral-300 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ImageIcon className="text-neutral-500" size={18} />
          <div className="text-xs">
            <span className="font-semibold block text-neutral-800">Logo de Factura (PNG/JPG)</span>
            <span className="text-neutral-500">{logoBase64 ? 'Logo cargado' : 'Opcional'}</span>
          </div>
        </div>
        {logoBase64 ? (
          <button onClick={() => setLogoBase64(null)} className="text-rose-600 p-1 hover:bg-rose-50 rounded-lg">
            <Trash2 size={16} />
          </button>
        ) : (
          <label className="cursor-pointer bg-black text-white text-xs px-3 py-2 rounded-xl font-medium shadow hover:bg-neutral-800 whitespace-nowrap">
            Subir Logo
            <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleCargarLogo} />
          </label>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-neutral-700 mb-1">Seleccionar Cliente</label>
        <select 
          className="w-full p-3 border border-neutral-200 rounded-2xl bg-neutral-50 text-neutral-900 text-xs"
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
        >
          <option value="">-- Elige un cliente --</option>
          {clientes.map(c => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>

      {clienteActual && (
        <div className="space-y-4 pt-2 border-t border-neutral-100">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Modalidad de Cobro</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTipoCobroSeleccionado('hora')}
                className={`flex-1 min-w-[120px] py-2 rounded-xl text-[11px] font-semibold border leading-tight ${tipoCobroSeleccionado === 'hora' ? 'bg-black text-white border-black' : 'bg-neutral-50 text-neutral-700 border-neutral-200'}`}
              >
                Por Hora (${clienteActual.tarifaHora}/h)
              </button>
              <button
                onClick={() => setTipoCobroSeleccionado('contrato')}
                className={`flex-1 min-w-[120px] py-2 rounded-xl text-[11px] font-semibold border leading-tight ${tipoCobroSeleccionado === 'contrato' ? 'bg-black text-white border-black' : 'bg-neutral-50 text-neutral-700 border-neutral-200'}`}
              >
                Contrato Fijo
              </button>
            </div>
          </div>

          {tipoCobroSeleccionado === 'contrato' && (
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Monto del Contrato ($)</label>
              <input 
                type="number"
                className="w-full p-3 border border-neutral-200 rounded-2xl bg-neutral-50 text-xs"
                placeholder="Ej. 500"
                value={montoContrato || ''}
                onChange={(e) => setMontoContrato(Number(e.target.value))}
              />
            </div>
          )}

          <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-2 text-xs">
            <div className="flex justify-between text-neutral-700">
              <span>Jornadas sin facturar:</span>
              <span className="font-bold">{registrosCliente.length}</span>
            </div>
            <div className="flex justify-between text-neutral-700">
              <span>Total Horas Acumuladas:</span>
              <span className="font-bold">{totalHorasCalculadas} hrs</span>
            </div>
            <div className="flex justify-between font-bold text-neutral-900 pt-2 border-t border-neutral-200 text-sm">
              <span>Total a Facturar:</span>
              <span className="text-emerald-600">${montoTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={generarPDF}
            disabled={registrosCliente.length === 0}
            className="w-full bg-black hover:bg-neutral-800 text-white py-3 rounded-2xl text-xs font-medium shadow flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <Download size={16} /> Descargar Factura en PDF
          </button>
        </div>
      )}
    </div>
  );
};