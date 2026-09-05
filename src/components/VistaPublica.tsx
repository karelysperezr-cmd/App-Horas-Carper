import { useEffect, useState } from 'react';
import { ArrowRight, Camera, Check, Lightbulb, LockKeyhole, Megaphone, Palette, Send, Sparkles } from 'lucide-react';
import { FormularioSolicitudCliente } from './FormularioSolicitudCliente';
import type { SolicitudPresupuesto } from '../types';

interface VistaPublicaProps {
  onEnviarSolicitud: (solicitud: SolicitudPresupuesto) => void;
  onAcceder: () => void;
}

const servicios = [
  { id: 'dev-ux-ui', nombre: 'UX/UI y producto', descripcion: 'Experiencias digitales claras, útiles y fáciles de usar.', icono: Lightbulb },
  { id: 'asesoria-marca', nombre: 'Diseño de marca', descripcion: 'Identidades visuales consistentes y reconocibles.', icono: Palette },
  { id: 'marketing-audiovisual', nombre: 'Marketing digital', descripcion: 'Contenido pensado para comunicar y convertir.', icono: Megaphone },
  { id: 'fotografia-eventos', nombre: 'Foto y video', descripcion: 'Registro visual preciso para tus momentos importantes.', icono: Camera }
] as const;

export function VistaPublica({ onEnviarSolicitud, onAcceder }: VistaPublicaProps) {
  const [servicioSeleccionado, setServicioSeleccionado] = useState<SolicitudPresupuesto['tipoServicio'] | null>(null);
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);

  useEffect(() => {
    if (!solicitudEnviada) return;
    const timeout = window.setTimeout(() => {
      setSolicitudEnviada(false);
      setServicioSeleccionado(null);
    }, 4500);
    return () => window.clearTimeout(timeout);
  }, [solicitudEnviada]);

  const abrirSolicitud = (servicio?: SolicitudPresupuesto['tipoServicio']) => {
    setServicioSeleccionado(servicio ?? 'dev-ux-ui');
    window.setTimeout(() => document.getElementById('solicitar-presupuesto')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#1d1d1f]">
      <header className="mx-auto flex max-w-6xl items-center justify-between border-b border-[#dededb] px-5 py-5 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1d1d1f] text-white"><Sparkles size={15} /></div>
          <p className="text-sm font-semibold tracking-[0.18em]">CARPER</p>
        </div>
        <button type="button" onClick={onAcceder} className="flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium text-[#6e6e73] transition hover:bg-[#ebebeb] hover:text-[#1d1d1f]"><LockKeyhole size={14} /> Acceso interno</button>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-20 pt-16 lg:px-10 lg:pt-24">
        {solicitudEnviada ? (
          <section className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1d1d1f] text-white"><Send size={24} /></div>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-[#6e6e73]">Solicitud recibida</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Gracias por escribirnos.</h1>
            <p className="mt-5 max-w-md text-base leading-7 text-[#6e6e73]">Hemos registrado tu solicitud. Revisaremos los detalles y nos pondremos en contacto contigo.</p>
            <button type="button" onClick={() => { setSolicitudEnviada(false); setServicioSeleccionado(null); }} className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#1d1d1f] px-5 py-3 text-sm font-medium text-white transition hover:bg-black">Volver al inicio <ArrowRight size={16} /></button>
          </section>
        ) : (
          <>
            <section className="border-b border-[#dededb] pb-20 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6e6e73]">Diseño · Estrategia · Comunicación</p>
              <h1 className="mx-auto mt-6 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-7xl">Ideas claras.<br />Resultados que permanecen.</h1>
              <p className="mx-auto mt-7 max-w-xl text-base leading-7 text-[#6e6e73]">Creamos experiencias digitales, marcas y contenido con una mirada precisa y esencial.</p>
              <button type="button" onClick={() => abrirSolicitud()} className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#1d1d1f] px-6 py-3.5 text-sm font-medium text-white transition hover:bg-black">Solicitar presupuesto <ArrowRight size={17} /></button>
            </section>

            <section className="mt-20" aria-labelledby="servicios-title">
              <div className="mb-8 flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6e6e73]">Servicios</p><h2 id="servicios-title" className="mt-2 text-2xl font-semibold tracking-tight">Selecciona una opción</h2></div><span className="hidden text-xs text-[#6e6e73] sm:block">Sin registro · Respuesta personalizada</span></div>
              <div className="grid border-y border-[#dededb] sm:grid-cols-2 lg:grid-cols-4">
                {servicios.map(({ id, nombre, descripcion, icono: Icon }) => (
                  <button key={id} type="button" onClick={() => abrirSolicitud(id)} className="group min-h-48 border-b border-[#dededb] p-6 text-left transition hover:bg-white sm:border-r lg:border-b-0 last:border-r-0">
                    <div className="mb-10 flex h-9 w-9 items-center justify-center rounded-full border border-[#c9c9c7] text-[#1d1d1f]"><Icon size={16} strokeWidth={1.7} /></div><h3 className="font-medium">{nombre}</h3><p className="mt-2 text-sm leading-5 text-[#6e6e73]">{descripcion}</p><span className="mt-5 flex items-center gap-1 text-xs font-medium text-[#1d1d1f] opacity-0 transition group-hover:opacity-100">Ver más <ArrowRight size={13} /></span>
                  </button>
                ))}
              </div>
            </section>

            {servicioSeleccionado && <section id="solicitar-presupuesto" className="mt-20 grid scroll-mt-6 gap-10 lg:grid-cols-[0.8fr_1.2fr]"><div className="pt-3"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6e6e73]">Solicitud</p><h2 className="mt-3 text-4xl font-semibold leading-tight tracking-tight">Cuéntanos qué necesitas.</h2><p className="mt-4 max-w-sm text-sm leading-6 text-[#6e6e73]">Completa los datos del proyecto. Te responderemos con una propuesta ajustada a tus necesidades.</p><div className="mt-8 space-y-3 text-sm text-[#6e6e73]"><p className="flex items-center gap-2"><Check size={15} /> Sin registro</p><p className="flex items-center gap-2"><Check size={15} /> Respuesta personalizada</p></div></div><FormularioSolicitudCliente key={servicioSeleccionado} initialService={servicioSeleccionado} onEnviarSolicitud={onEnviarSolicitud} onSolicitudEnviada={() => setSolicitudEnviada(true)} className="border-[#dededb] shadow-none" /> </section>}
          </>
        )}
      </main>
    </div>
  );
}