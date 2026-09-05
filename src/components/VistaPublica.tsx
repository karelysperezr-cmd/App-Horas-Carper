import { useState } from 'react';
import { ArrowRight, BriefcaseBusiness, Camera, Check, Lightbulb, LockKeyhole, Megaphone, Palette, Sparkles } from 'lucide-react';
import { FormularioSolicitudCliente } from './FormularioSolicitudCliente';
import type { SolicitudPresupuesto } from '../types';

interface VistaPublicaProps {
  onEnviarSolicitud: (solicitud: SolicitudPresupuesto) => void;
  onAcceder: () => void;
}

const servicios = [
  { id: 'dev-ux-ui', nombre: 'UX/UI y producto', descripcion: 'Experiencias digitales claras, útiles y listas para crecer.', icono: Lightbulb, color: 'bg-lime-100 text-lime-950' },
  { id: 'asesoria-marca', nombre: 'Diseño de marca', descripcion: 'Una identidad visual con dirección y criterio.', icono: Palette, color: 'bg-orange-100 text-orange-950' },
  { id: 'marketing-audiovisual', nombre: 'Marketing digital', descripcion: 'Contenido que convierte atención en oportunidades.', icono: Megaphone, color: 'bg-sky-100 text-sky-950' },
  { id: 'fotografia-eventos', nombre: 'Foto y video', descripcion: 'Historias visuales para momentos que importan.', icono: Camera, color: 'bg-rose-100 text-rose-950' }
] as const;

export function VistaPublica({ onEnviarSolicitud, onAcceder }: VistaPublicaProps) {
  const [servicioSeleccionado, setServicioSeleccionado] = useState<SolicitudPresupuesto['tipoServicio'] | null>(null);

  const abrirSolicitud = (servicio?: SolicitudPresupuesto['tipoServicio']) => {
    setServicioSeleccionado(servicio ?? 'dev-ux-ui');
    window.setTimeout(() => document.getElementById('solicitar-presupuesto')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#f5f1e8] text-[#20251f]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#20251f] text-[#f5f1e8]"><Sparkles size={19} /></div>
          <div><p className="text-sm font-bold tracking-[0.22em]">CARPER</p><p className="text-[10px] uppercase tracking-[0.18em] text-[#687064]">Estudio digital</p></div>
        </div>
        <button type="button" onClick={onAcceder} className="flex items-center gap-2 rounded-full border border-[#c9c4b8] px-4 py-2 text-xs font-semibold transition hover:border-[#20251f] hover:bg-white"><LockKeyhole size={14} /> Acceso interno</button>
      </header>

      <main className="mx-auto max-w-7xl px-5 pb-16 pt-10 lg:px-10 lg:pt-16">
        <section className="grid items-end gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="max-w-3xl">
            <p className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#e1643c]"><span className="h-2 w-2 rounded-full bg-[#e1643c]" /> Ideas que toman forma</p>
            <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">Diseñamos lo que tu próximo paso necesita.</h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-[#687064]">Estrategia, diseño y contenido para convertir una buena idea en una experiencia que la gente quiera usar.</p>
            <button type="button" onClick={() => abrirSolicitud()} className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#20251f] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#3c473b]">Solicitar presupuesto <ArrowRight size={17} /></button>
          </div>
          <div className="relative min-h-56 rounded-[2rem] bg-[#d5e1c0] p-7 lg:min-h-72">
            <div className="absolute right-7 top-7 flex h-16 w-16 items-center justify-center rounded-full bg-[#e1643c] text-white"><BriefcaseBusiness size={25} /></div>
            <div className="absolute bottom-7 left-7 max-w-xs"><p className="text-3xl font-black leading-none">Un equipo pequeño.<br />Una mirada completa.</p><p className="mt-4 text-sm text-[#526048]">Cuéntanos qué quieres construir y te respondemos con claridad.</p></div>
          </div>
        </section>

        <section className="mt-20" aria-labelledby="servicios-title">
          <div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#687064]">Accesos rápidos</p><h2 id="servicios-title" className="mt-2 text-2xl font-black">¿En qué podemos ayudarte?</h2></div><span className="hidden text-xs text-[#687064] sm:block">Selecciona un servicio para comenzar</span></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {servicios.map(({ id, nombre, descripcion, icono: Icon, color }) => (
              <button key={id} type="button" onClick={() => abrirSolicitud(id)} className="group min-h-48 rounded-3xl border border-[#d8d2c6] bg-[#fbf8f1] p-5 text-left transition hover:-translate-y-1 hover:border-[#20251f] hover:shadow-lg">
                <div className={`mb-8 flex h-11 w-11 items-center justify-center rounded-2xl ${color}`}><Icon size={20} /></div><h3 className="font-bold">{nombre}</h3><p className="mt-2 text-sm leading-5 text-[#687064]">{descripcion}</p><span className="mt-4 flex items-center gap-1 text-xs font-bold opacity-0 transition group-hover:opacity-100">Empezar <ArrowRight size={13} /></span>
              </button>
            ))}
          </div>
        </section>

        {servicioSeleccionado && (
          <section id="solicitar-presupuesto" className="mt-20 grid scroll-mt-6 gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="pt-3"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e1643c]">Sin registro</p><h2 className="mt-3 text-4xl font-black leading-tight">Hablemos de tu proyecto.</h2><p className="mt-4 max-w-sm text-sm leading-6 text-[#687064]">Déjanos los datos esenciales. La solicitud se registrará y podrás enviarla directamente desde tu correo.</p><div className="mt-8 space-y-3 text-sm text-[#526048]"><p className="flex items-center gap-2"><Check size={16} /> Respuesta personalizada</p><p className="flex items-center gap-2"><Check size={16} /> Sin compromiso</p><p className="flex items-center gap-2"><Check size={16} /> Propuesta clara de alcance</p></div></div>
            <FormularioSolicitudCliente key={servicioSeleccionado} initialService={servicioSeleccionado} onEnviarSolicitud={onEnviarSolicitud} className="border-[#d8d2c6] shadow-xl" />
          </section>
        )}
      </main>
    </div>
  );
}