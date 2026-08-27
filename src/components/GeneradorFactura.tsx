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

    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'JPEG', 20, 15, 25, 25);
        currentY = 45;
      } catch (error) {
        console.error("Error al incrustar logo", error);
      }
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text("FACTURA DE SERVICIOS", logoBase64 ? 52 : 20, currentY);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Fecha de emisión: ${fechaActual}`, logoBase64 ? 52 : 20, currentY + 7);

    currentY += 20;

    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text(`Cliente: ${clienteActual.nombre}`, 20, currentY);
    doc.text(`Modalidad: ${tipoCobroSeleccionado === 'hora' ? 'Pago por Hora' : 'Contrato Fijo'}`, 20, currentY + 8);

    currentY += 20;

    doc.setFont("helvetica", "bold");
    doc.text("Resumen de Actividades y Jornadas", 20, currentY);
    currentY += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    registrosCliente.forEach((reg) => {
      if (currentY > 270) {
        doc.addPage();
        currentY = 20;
      }
      doc.text(`• Fecha: ${reg.fecha} — Horas: ${reg.totalHoras}h`, 20, currentY);
      currentY += 6;

      reg.actividades.forEach(act => {
        doc.text(`   - [${act.tipo.toUpperCase()}] ${act.descripcion}`, 25, currentY);
        currentY += 6;
      });
      currentY += 4;
    });

    currentY += 10;
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setLineWidth(0.5);
    doc.line(20, currentY, 190, currentY);
    currentY += 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    if (tipoCobroSeleccionado === 'hora') {
      doc.text(`Total Horas Trabajadas: ${totalHorasCalculadas} hrs`, 20, currentY);
      doc.text(`Tarifa por Hora: $${clienteActual.tarifaHora}`, 20, currentY + 8);
      doc.text(`Monto Total a Pagar: $${montoTotal.toFixed(2)}`, 20, currentY + 16);
    } else {
      doc.text(`Monto Total por Contrato: $${montoTotal.toFixed(2)}`, 20, currentY);
    }

    doc.save(`Factura_${clienteActual.nombre.replace(/\s+/g, '_')}_${Date.now()}.pdf`);

    const nuevaFactura: Factura = {
      id: Date.now().toString(),
      clienteId,
      fechaEmision: fechaActual,
      registrosIds: registrosCliente.map(r => r.id),
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

      <div className="p-3 bg-neutral-50 rounded-2xl border border-dashed border-neutral-300 flex items-center justify-between">
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
          <label className="cursor-pointer bg-black text-white text-xs px-3 py-2 rounded-xl font-medium shadow hover:bg-neutral-800">
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
            <div className="flex gap-2">
              <button
                onClick={() => setTipoCobroSeleccionado('hora')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border ${tipoCobroSeleccionado === 'hora' ? 'bg-black text-white border-black' : 'bg-neutral-50 text-neutral-700 border-neutral-200'}`}
              >
                Por Hora (${clienteActual.tarifaHora}/h)
              </button>
              <button
                onClick={() => setTipoCobroSeleccionado('contrato')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border ${tipoCobroSeleccionado === 'contrato' ? 'bg-black text-white border-black' : 'bg-neutral-50 text-neutral-700 border-neutral-200'}`}
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