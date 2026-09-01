import React, { useEffect, useState } from 'react';
import { CalendarDays, Mail, Sparkles, CheckCircle2 } from 'lucide-react';
import type { SolicitudPresupuesto } from '../types';

interface SolicitudesClienteProps {
  solicitudes: SolicitudPresupuesto[];
  onActualizarEstado: (
    id: string,
    estado: SolicitudPresupuesto['estado'],
    reunionDetalles?: { reunionFecha?: string; reunionHora?: string; reunionNotas?: string }
  ) => void;
}

const etiquetasServicio: Record<SolicitudPresupuesto['tipoServicio'], string> = {
  'dev-ux-ui': 'Desarrollo / UX-UI',
  'asesoria-marca': 'Asesoría de Marca Digital',
  'marketing-audiovisual': 'Marketing Audiovisual',
  'fotografia-eventos': 'Fotografía / Video documental de eventos'
};

export const SolicitudesCliente: React.FC<SolicitudesClienteProps> = ({ solicitudes, onActualizarEstado }) => {
  const [reunionDatos, setReunionDatos] = useState<Record<string, { reunionFecha: string; reunionHora: string; reunionNotas: string }>>({});

  useEffect(() => {
    const siguienteEstado = Object.fromEntries(
      solicitudes.map((solicitud) => [
        solicitud.id,
        {
          reunionFecha: solicitud.reunionFecha ?? '',
          reunionHora: solicitud.reunionHora ?? '',
          reunionNotas: solicitud.reunionNotas ?? ''
        }
      ])
    );
    setReunionDatos(siguienteEstado);
  }, [solicitudes]);

  return (
    <div className="space-y-3 my-2">
      <div className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-black" />
          <h3 className="text-sm font-semibold text-neutral-900">Solicitudes de presupuesto</h3>
        </div>
        <p className="mt-1 text-[11px] text-neutral-500">Aquí puedes revisar cada solicitud y preparar una reunión.</p>
      </div>

      {solicitudes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 p-5 text-center text-sm text-neutral-500">
          Aún no llegan solicitudes desde el formulario de clientes.
        </div>
      ) : (
        solicitudes.map((solicitud) => (
          <div key={solicitud.id} className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-neutral-900">{solicitud.nombreCliente}</p>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-neutral-500">
                  <Mail size={12} /> {solicitud.correo}
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${solicitud.estado === 'nuevo' ? 'bg-amber-100 text-amber-700' : solicitud.estado === 'agendado' ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {solicitud.estado === 'nuevo' ? 'Nuevo' : solicitud.estado === 'agendado' ? 'Agendado' : 'Revisado'}
              </span>
            </div>

            <div className="rounded-2xl bg-neutral-50 p-3 text-[11px] text-neutral-700 space-y-1">
              <div className="flex justify-between">
                <span className="font-semibold">Servicio</span>
                <span>{etiquetasServicio[solicitud.tipoServicio]}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Fecha</span>
                <span>{solicitud.fechaSolicitud}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Pago</span>
                <span>{solicitud.metodoPago} • {solicitud.moneda}</span>
              </div>
            </div>

            <div className="space-y-1 text-[11px] text-neutral-700">
              <p className="font-semibold text-neutral-900">Detalle</p>
              <p>{solicitud.descripcionProyecto || 'Sin descripción'}</p>
              {solicitud.problemaServicio && <p><span className="font-semibold">Problema:</span> {solicitud.problemaServicio}</p>}
              {solicitud.redesSociales && <p><span className="font-semibold">Redes:</span> {solicitud.redesSociales}</p>}
              {solicitud.lugarEvento && <p><span className="font-semibold">Lugar:</span> {solicitud.lugarEvento}</p>}
              {solicitud.fechaEvento && <p><span className="font-semibold">Evento:</span> {solicitud.fechaEvento} • {solicitud.horaEvento}</p>}
              {solicitud.invitados && <p><span className="font-semibold">Invitados:</span> {solicitud.invitados}</p>}
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-[11px] text-neutral-700">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-semibold text-neutral-700">Fecha de reunión</label>
                  <input
                    type="date"
                    value={reunionDatos[solicitud.id]?.reunionFecha ?? ''}
                    onChange={(event) =>
                      setReunionDatos((prev) => ({
                        ...prev,
                        [solicitud.id]: {
                          reunionFecha: event.target.value,
                          reunionHora: prev[solicitud.id]?.reunionHora ?? '',
                          reunionNotas: prev[solicitud.id]?.reunionNotas ?? ''
                        }
                      }))
                    }
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-2.5 py-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-neutral-700">Hora</label>
                  <input
                    type="time"
                    value={reunionDatos[solicitud.id]?.reunionHora ?? ''}
                    onChange={(event) =>
                      setReunionDatos((prev) => ({
                        ...prev,
                        [solicitud.id]: {
                          reunionFecha: prev[solicitud.id]?.reunionFecha ?? '',
                          reunionHora: event.target.value,
                          reunionNotas: prev[solicitud.id]?.reunionNotas ?? ''
                        }
                      }))
                    }
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-2.5 py-2"
                  />
                </div>
              </div>
              <div className="mt-2">
                <label className="mb-1 block font-semibold text-neutral-700">Notas de la reunión</label>
                <textarea
                  rows={2}
                  value={reunionDatos[solicitud.id]?.reunionNotas ?? ''}
                  onChange={(event) =>
                    setReunionDatos((prev) => ({
                      ...prev,
                      [solicitud.id]: {
                        reunionFecha: prev[solicitud.id]?.reunionFecha ?? '',
                        reunionHora: prev[solicitud.id]?.reunionHora ?? '',
                        reunionNotas: event.target.value
                      }
                    }))
                  }
                  className="w-full rounded-2xl border border-neutral-200 bg-white px-2.5 py-2"
                  placeholder="Objetivo, temas o recordatorio"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onActualizarEstado(solicitud.id, solicitud.estado === 'nuevo' ? 'revisado' : 'nuevo')}
                className="flex items-center gap-1 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-[11px] font-semibold text-neutral-700"
              >
                <CheckCircle2 size={12} /> {solicitud.estado === 'nuevo' ? 'Marcar como revisada' : 'Marcar como nueva'}
              </button>
              <button
                onClick={() =>
                  onActualizarEstado(solicitud.id, 'agendado', {
                    reunionFecha: reunionDatos[solicitud.id]?.reunionFecha,
                    reunionHora: reunionDatos[solicitud.id]?.reunionHora,
                    reunionNotas: reunionDatos[solicitud.id]?.reunionNotas
                  })
                }
                className="flex items-center gap-1 rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-[11px] font-semibold text-neutral-700"
              >
                <CalendarDays size={12} /> {solicitud.estado === 'agendado' ? 'Actualizar reunión' : 'Guardar reunión'}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
