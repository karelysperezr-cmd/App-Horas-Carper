import React, { useState } from 'react';
import { Mail, Sparkles, Send } from 'lucide-react';
import type { SolicitudPresupuesto } from '../types';

interface FormularioSolicitudClienteProps {
  onEnviarSolicitud: (solicitud: SolicitudPresupuesto) => void;
  className?: string;
}

const opcionesServicio = [
  { value: 'dev-ux-ui', label: 'Desarrollo / UX/UI' },
  { value: 'asesoria-marca', label: 'Asesoría de Marca Digital' },
  { value: 'marketing-audiovisual', label: 'Marketing Audiovisual' },
  { value: 'fotografia-eventos', label: 'Fotografía / Video documental de eventos' }
] as const;

export const FormularioSolicitudCliente: React.FC<FormularioSolicitudClienteProps> = ({ onEnviarSolicitud, className = '' }) => {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [tipoServicio, setTipoServicio] = useState<SolicitudPresupuesto['tipoServicio']>('dev-ux-ui');
  const [descripcionProyecto, setDescripcionProyecto] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [fechaEvento, setFechaEvento] = useState('');
  const [horaEvento, setHoraEvento] = useState('');
  const [duracionProyecto, setDuracionProyecto] = useState('');
  const [duracionEvento, setDuracionEvento] = useState('');
  const [lugarEvento, setLugarEvento] = useState('');
  const [invitados, setInvitados] = useState('');
  const [problemaServicio, setProblemaServicio] = useState('');
  const [redesSociales, setRedesSociales] = useState('');
  const [metodoPago, setMetodoPago] = useState('Transferencia');
  const [moneda, setMoneda] = useState<SolicitudPresupuesto['moneda']>('USD');
  const [mensajeExito, setMensajeExito] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim() || !correo.trim() || !descripcionProyecto.trim()) {
      setMensajeExito('Por favor completa tu nombre, correo y una descripción breve del proyecto.');
      return;
    }

    const solicitud: SolicitudPresupuesto = {
      id: Date.now().toString(),
      nombreCliente: nombre.trim(),
      correo: correo.trim(),
      tipoServicio,
      descripcionProyecto: descripcionProyecto.trim(),
      fechaEntrega: fechaEntrega || undefined,
      fechaEvento: fechaEvento || undefined,
      horaEvento: horaEvento || undefined,
      duracionProyecto: duracionProyecto || undefined,
      duracionEvento: duracionEvento || undefined,
      lugarEvento: lugarEvento || undefined,
      invitados: invitados || undefined,
      problemaServicio: problemaServicio || undefined,
      redesSociales: redesSociales || undefined,
      metodoPago,
      moneda,
      estado: 'nuevo',
      fechaSolicitud: new Date().toLocaleDateString('es-ES')
    };

    onEnviarSolicitud(solicitud);
    setMensajeExito('Solicitud enviada correctamente. Se abrirá tu cliente de correo para enviar una copia.');

    const cuerpo = [
      `Hola, soy ${solicitud.nombreCliente}`,
      `Correo: ${solicitud.correo}`,
      `Servicio: ${opcionesServicio.find((item) => item.value === solicitud.tipoServicio)?.label}`,
      `Descripción: ${solicitud.descripcionProyecto}`,
      solicitud.fechaEntrega ? `Fecha de entrega: ${solicitud.fechaEntrega}` : '',
      solicitud.fechaEvento ? `Fecha del evento: ${solicitud.fechaEvento}` : '',
      solicitud.horaEvento ? `Hora del evento: ${solicitud.horaEvento}` : '',
      solicitud.duracionProyecto ? `Duración del proyecto: ${solicitud.duracionProyecto}` : '',
      solicitud.duracionEvento ? `Duración del evento: ${solicitud.duracionEvento}` : '',
      solicitud.lugarEvento ? `Lugar: ${solicitud.lugarEvento}` : '',
      solicitud.invitados ? `Invitados: ${solicitud.invitados}` : '',
      solicitud.problemaServicio ? `Problema: ${solicitud.problemaServicio}` : '',
      solicitud.redesSociales ? `Redes: ${solicitud.redesSociales}` : '',
      `Método de pago: ${solicitud.metodoPago}`,
      `Moneda: ${solicitud.moneda}`
    ].filter(Boolean).join('\n');

    const subject = encodeURIComponent('Solicitud de presupuesto - CARPER');
    const body = encodeURIComponent(cuerpo);
    window.location.href = `mailto:${correo.trim()}?subject=${subject}&body=${body}`;

    setNombre('');
    setCorreo('');
    setDescripcionProyecto('');
    setFechaEntrega('');
    setFechaEvento('');
    setHoraEvento('');
    setDuracionProyecto('');
    setDuracionEvento('');
    setLugarEvento('');
    setInvitados('');
    setProblemaServicio('');
    setRedesSociales('');
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-3 rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm ${className}`}>
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-black" />
        <h3 className="text-sm font-semibold text-neutral-900">Solicita tu presupuesto</h3>
      </div>

      {mensajeExito && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-[11px] text-emerald-800">
          {mensajeExito}
        </div>
      )}

      <div>
        <label className="mb-1 block text-[11px] font-semibold text-neutral-700">Tu nombre</label>
        <input
          type="text"
          className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 p-2.5 text-sm"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre completo"
        />
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-semibold text-neutral-700">Correo</label>
        <input
          type="email"
          className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 p-2.5 text-sm"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          placeholder="tu@email.com"
        />
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-semibold text-neutral-700">Tipo de servicio</label>
        <select
          className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 p-2.5 text-sm"
          value={tipoServicio}
          onChange={(e) => setTipoServicio(e.target.value as SolicitudPresupuesto['tipoServicio'])}
        >
          {opcionesServicio.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-semibold text-neutral-700">Describe lo que necesitas</label>
        <textarea
          rows={3}
          className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 p-2.5 text-sm"
          value={descripcionProyecto}
          onChange={(e) => setDescripcionProyecto(e.target.value)}
          placeholder="Cuenta el proyecto, evento o necesidad"
        />
      </div>

      {tipoServicio === 'dev-ux-ui' && (
        <div className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-neutral-700">Fecha de entrega</label>
            <input type="date" className="w-full rounded-2xl border border-neutral-200 bg-white p-2.5 text-sm" value={fechaEntrega} onChange={(e) => setFechaEntrega(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-neutral-700">Duración del proyecto</label>
            <input type="text" className="w-full rounded-2xl border border-neutral-200 bg-white p-2.5 text-sm" value={duracionProyecto} onChange={(e) => setDuracionProyecto(e.target.value)} placeholder="Ej. 3 semanas" />
          </div>
        </div>
      )}

      {tipoServicio === 'asesoria-marca' && (
        <div className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-neutral-700">Describe tu problema</label>
            <textarea rows={3} className="w-full rounded-2xl border border-neutral-200 bg-white p-2.5 text-sm" value={problemaServicio} onChange={(e) => setProblemaServicio(e.target.value)} placeholder="Cuéntanos qué problema necesitas resolver" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-neutral-700">Link de redes sociales</label>
            <input type="text" className="w-full rounded-2xl border border-neutral-200 bg-white p-2.5 text-sm" value={redesSociales} onChange={(e) => setRedesSociales(e.target.value)} placeholder="https://instagram.com/tu-marca" />
          </div>
        </div>
      )}

      {tipoServicio === 'marketing-audiovisual' && (
        <div className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-neutral-700">Fecha del evento / trabajo</label>
            <input type="date" className="w-full rounded-2xl border border-neutral-200 bg-white p-2.5 text-sm" value={fechaEvento} onChange={(e) => setFechaEvento(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-neutral-700">Duración</label>
            <input type="text" className="w-full rounded-2xl border border-neutral-200 bg-white p-2.5 text-sm" value={duracionEvento} onChange={(e) => setDuracionEvento(e.target.value)} placeholder="Ej. 1 día" />
          </div>
        </div>
      )}

      {tipoServicio === 'fotografia-eventos' && (
        <div className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-neutral-700">Lugar del evento</label>
            <input type="text" className="w-full rounded-2xl border border-neutral-200 bg-white p-2.5 text-sm" value={lugarEvento} onChange={(e) => setLugarEvento(e.target.value)} placeholder="Ciudad o dirección" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-neutral-700">Fecha</label>
              <input type="date" className="w-full rounded-2xl border border-neutral-200 bg-white p-2.5 text-sm" value={fechaEvento} onChange={(e) => setFechaEvento(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-neutral-700">Hora</label>
              <input type="time" className="w-full rounded-2xl border border-neutral-200 bg-white p-2.5 text-sm" value={horaEvento} onChange={(e) => setHoraEvento(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-neutral-700">Cantidad de invitados</label>
            <input type="text" className="w-full rounded-2xl border border-neutral-200 bg-white p-2.5 text-sm" value={invitados} onChange={(e) => setInvitados(e.target.value)} placeholder="Ej. 120 personas" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-neutral-700">Método de pago</label>
          <select className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 p-2.5 text-sm" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
            <option value="Transferencia">Transferencia</option>
            <option value="Efectivo">Efectivo</option>
            <option value="Tarjeta">Tarjeta</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-neutral-700">Moneda</label>
          <select className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 p-2.5 text-sm" value={moneda} onChange={(e) => setMoneda(e.target.value as SolicitudPresupuesto['moneda'])}>
            <option value="USD">USD</option>
            <option value="VES">VES</option>
          </select>
        </div>
      </div>

      <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-3 py-2.5 text-sm font-semibold text-white">
        <Send size={15} /> Enviar solicitud
      </button>

      <div className="flex items-center gap-2 text-[10px] text-neutral-500">
        <Mail size={12} /> Recibirás una copia en tu correo y también quedará registrada aquí.
      </div>
    </form>
  );
};
