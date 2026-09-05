import React, { useEffect, useState } from 'react';
import { Camera, Wifi, Clock, CheckCircle, Square, Coffee, TrendingUp, Briefcase, Save, RotateCcw, Edit3 } from 'lucide-react';
import type { Cliente, Actividad, RegistroJornada } from '../types';

interface FichajeProps {
  clientes: Cliente[];
  registros: RegistroJornada[];
  onGuardarRegistro: (registro: RegistroJornada) => void;
  onActualizarRegistro: (registro: RegistroJornada) => void;
  onEliminarRegistro: (registroId: string) => void;
  onAbrirClientes: () => void;
  onAbrirPresupuestos: () => void;
}

interface DraftState {
  clienteId: string;
  etapa: 'inicio' | 'entrada' | 'trabajando' | 'break' | 'finalizado';
  fechaSeleccionada: string;
  horaEntrada: string;
  wifiVerificado: boolean;
  listaActividades: Actividad[];
  duracionHoras: number;
}

const obtenerInicioSemana = (fecha: string) => {
  const dia = new Date(`${fecha}T12:00:00`);
  const diaSemana = dia.getDay() || 7;
  dia.setDate(dia.getDate() - diaSemana + 1);
  return dia.toISOString().split('T')[0];
};

const perteneceASemana = (fecha: string, inicioSemana: string) => {
  const inicio = new Date(`${inicioSemana}T12:00:00`);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 6);
  const fechaRegistro = new Date(`${fecha}T12:00:00`);
  return fechaRegistro >= inicio && fechaRegistro <= fin;
};

const moverSemana = (inicioSemana: string, semanas: number) => {
  const fecha = new Date(`${inicioSemana}T12:00:00`);
  fecha.setDate(fecha.getDate() + semanas * 7);
  return fecha.toISOString().split('T')[0];
};

const etiquetaSemana = (inicioSemana: string) => {
  const inicio = new Date(`${inicioSemana}T12:00:00`);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 6);
  return `${inicio.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} - ${fin.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}`;
};

export const Fichaje: React.FC<FichajeProps> = ({ clientes, registros, onGuardarRegistro, onActualizarRegistro, onEliminarRegistro, onAbrirClientes, onAbrirPresupuestos }) => {
  const hoy = new Date().toISOString().split('T')[0];

  const [clienteSeleccionado, setClienteSeleccionado] = useState<string>('');
  const [etapa, setEtapa] = useState<'inicio' | 'entrada' | 'trabajando' | 'break' | 'finalizado'>('inicio');
  const [duracionHoras, setDuracionHoras] = useState<number>(8);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(hoy);

  const [horaEntrada, setHoraEntrada] = useState<string>('');
  const [wifiVerificado, setWifiVerificado] = useState<boolean>(false);

  const [tipoActividad, setTipoActividad] = useState<Actividad['tipo']>('video');
  const [descripcionActividad, setDescripcionActividad] = useState<string>('');
  const [listaActividades, setListaActividades] = useState<Actividad[]>([]);
  const [mensajeBorrador, setMensajeBorrador] = useState<string>('');
  const [borradorCargado, setBorradorCargado] = useState<DraftState | null>(null);
  const [registroEditandoId, setRegistroEditandoId] = useState<string | null>(null);
  const [registroEditando, setRegistroEditando] = useState<RegistroJornada | null>(null);
  const [descripcionEdicion, setDescripcionEdicion] = useState<string>('');
  const [filtroNotificaciones, setFiltroNotificaciones] = useState<'todas' | 'criticas' | 'advertencias'>('todas');
  const [semanaActiva, setSemanaActiva] = useState(() => obtenerInicioSemana(hoy));
  const [mostrarSelectorFichaje, setMostrarSelectorFichaje] = useState(false);

  const registrosSemana = registros.filter((registro) => perteneceASemana(registro.fecha, semanaActiva));
  const totalHorasSemana = registrosSemana.reduce((acc, curr) => acc + (curr.totalHoras || 0), 0);
  const progresoCiclo = Math.min(100, Math.round((totalHorasSemana / 40) * 100));

  const notificaciones = [
    {
      id: '1',
      titulo: 'Revisión de presupuesto pendiente',
      descripcion: 'El cliente Intercenter necesita confirmar el alcance antes de cerrar la propuesta.',
      severidad: 'Crítica' as const,
      sinLeer: true
    },
    {
      id: '2',
      titulo: 'Fichaje incompleto',
      descripcion: 'Hay un registro sin finalizar en la jornada del cliente DICA CASTELL.',
      severidad: 'Advertencia' as const,
      sinLeer: true
    },
    {
      id: '3',
      titulo: 'Actualización de agenda',
      descripcion: 'La reunión con el equipo de producción se ha movido a las 16:30.',
      severidad: 'Informativa' as const,
      sinLeer: false
    }
  ];

  const notificacionesFiltradas = notificaciones.filter((item) => {
    if (filtroNotificaciones === 'criticas') return item.severidad === 'Crítica';
    if (filtroNotificaciones === 'advertencias') return item.severidad === 'Advertencia';
    return true;
  });

  useEffect(() => {
    const savedDraft = window.localStorage.getItem('carper-draft-registro');
    if (!savedDraft) return;

    try {
      const parsed = JSON.parse(savedDraft) as DraftState;
      setBorradorCargado(parsed);
      setClienteSeleccionado(parsed.clienteId || '');
      setHoraEntrada(parsed.horaEntrada || '');
      setWifiVerificado(parsed.wifiVerificado || false);
      setListaActividades(parsed.listaActividades || []);
      setDuracionHoras(parsed.duracionHoras || 8);
      setFechaSeleccionada(parsed.fechaSeleccionada || hoy);
      setEtapa(parsed.etapa || 'entrada');
      setMensajeBorrador('Tienes un registro guardado. Puedes retomarlo cuando quieras.');
    } catch {
      window.localStorage.removeItem('carper-draft-registro');
    }
  }, []);

  const guardarBorrador = (siguienteEtapa: DraftState['etapa'] = etapa) => {
    const draft: DraftState = {
      clienteId: clienteSeleccionado,
      etapa: siguienteEtapa,
      fechaSeleccionada,
      horaEntrada,
      wifiVerificado,
      listaActividades,
      duracionHoras
    };

    window.localStorage.setItem('carper-draft-registro', JSON.stringify(draft));
    setBorradorCargado(draft);
    setMensajeBorrador('Registro guardado para continuar más tarde.');
  };

  const cargarBorrador = () => {
    if (!borradorCargado) return;
    setClienteSeleccionado(borradorCargado.clienteId);
    setHoraEntrada(borradorCargado.horaEntrada);
    setWifiVerificado(borradorCargado.wifiVerificado);
    setListaActividades(borradorCargado.listaActividades);
    setDuracionHoras(borradorCargado.duracionHoras || 8);
    setFechaSeleccionada(borradorCargado.fechaSeleccionada || hoy);
    setEtapa(borradorCargado.etapa || 'entrada');
    setMensajeBorrador('Continuando tu registro guardado.');
  };

  const limpiarBorrador = () => {
    window.localStorage.removeItem('carper-draft-registro');
    setBorradorCargado(null);
    setMensajeBorrador('');
  };

  const handleCapturaFoto = (tipo: 'entrada' | 'salida', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (tipo === 'entrada') {
        setHoraEntrada(horaActual);
        setWifiVerificado(true);
      }
    }
  };

  const agregarActividad = () => {
    if (!descripcionActividad.trim()) return;
    const nuevaAct: Actividad = {
      id: Date.now().toString(),
      tipo: tipoActividad,
      descripcion: descripcionActividad
    };
    setListaActividades([...listaActividades, nuevaAct]);
    setDescripcionActividad('');
  };

  const finalizarJornada = () => {
    const nuevoRegistro: RegistroJornada = {
      id: Date.now().toString(),
      clienteId: clienteSeleccionado,
      fecha: fechaSeleccionada,
      horaEntrada,
      horaSalida: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      wifiEntradaValido: wifiVerificado,
      actividades: listaActividades,
      totalHoras: duracionHoras,
      completado: true
    };

    onGuardarRegistro(nuevoRegistro);
    limpiarBorrador();
    setEtapa('finalizado');
  };

  const abrirEdicionRegistro = (registro: RegistroJornada) => {
    setRegistroEditandoId(registro.id);
    setRegistroEditando({ ...registro, actividades: [...registro.actividades] });
    setDescripcionEdicion('');
  };

  const guardarEdicionRegistro = () => {
    if (!registroEditando) return;

    onActualizarRegistro(registroEditando);
    setRegistroEditandoId(null);
    setRegistroEditando(null);
  };

  const agregarActividadEdicion = () => {
    if (!registroEditando || !descripcionEdicion.trim()) return;

    setRegistroEditando({
      ...registroEditando,
      actividades: [
        ...registroEditando.actividades,
        { id: Date.now().toString(), tipo: 'otro', descripcion: descripcionEdicion.trim() }
      ]
    });
    setDescripcionEdicion('');
  };

  const eliminarActividadEdicion = (index: number) => {
    if (!registroEditando) return;

    const nuevasActividades = registroEditando.actividades.filter((_, i) => i !== index);
    setRegistroEditando({ ...registroEditando, actividades: nuevasActividades });
  };

  return (
    <div className="w-full p-4 space-y-4 my-2">
      {etapa === 'inicio' && (
        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-4 xl:gap-6">
            <div className="col-span-12 xl:col-span-5 rounded-3xl bg-black p-5 text-white shadow-xl space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase tracking-wider text-neutral-400 font-semibold flex items-center gap-1.5">
                  <TrendingUp size={14} /> Progreso del ciclo
                </span>
                <span className="text-xs bg-neutral-800 text-neutral-300 px-2.5 py-1 rounded-full">Semana activa</span>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-2">
                <button onClick={() => setSemanaActiva(moverSemana(semanaActiva, -1))} className="rounded-xl px-3 py-1 text-xs text-neutral-300 hover:bg-neutral-800">Anterior</button>
                <span className="text-xs font-medium text-white">{etiquetaSemana(semanaActiva)}</span>
                <button onClick={() => setSemanaActiva(moverSemana(semanaActiva, 1))} className="rounded-xl px-3 py-1 text-xs text-neutral-300 hover:bg-neutral-800">Siguiente</button>
              </div>
              <div className="flex items-baseline gap-2">
                <h2 className="text-4xl font-bold tracking-tight">{totalHorasSemana}</h2>
                <span className="text-sm text-neutral-400 font-medium">horas registradas</span>
              </div>
              <div className="h-2 rounded-full bg-neutral-800">
                <div className="h-2 rounded-full bg-emerald-400" style={{ width: `${progresoCiclo}%` }} />
              </div>
              <div className="grid gap-2 text-xs text-neutral-300">
                <div className="flex items-center justify-between rounded-2xl border border-neutral-800 bg-neutral-900/70 px-3 py-2">
                  <span>Avance del ciclo</span>
                  <span className="font-semibold text-white">{progresoCiclo}%</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-neutral-800 bg-neutral-900/70 px-3 py-2">
                  <span>Jornadas cerradas</span>
                  <span className="font-semibold text-white">{registrosSemana.length}</span>
                </div>
              </div>
            </div>

            <div className="col-span-12 xl:col-span-7 flex items-center rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3">
                <button
                  onClick={() => {
                    if (clientes.length === 0) {
                      onAbrirClientes();
                      return;
                    }
                    setMostrarSelectorFichaje(true);
                  }}
                  className="rounded-2xl bg-black px-3 py-4 text-xs font-semibold text-white shadow-sm"
                >
                  Fichar general
                </button>
                <button onClick={onAbrirClientes} className="rounded-2xl border border-neutral-200 bg-white px-3 py-4 text-xs font-semibold text-neutral-700">Agregar cliente</button>
                <button onClick={onAbrirPresupuestos} className="rounded-2xl border border-neutral-200 bg-white px-3 py-4 text-xs font-semibold text-neutral-700">Facturar horas</button>
              </div>
            </div>
          </div>

          <details className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <summary className="cursor-pointer list-none px-4 py-3 text-xs font-semibold text-neutral-700">Notificaciones <span className="ml-1 font-normal text-neutral-400">(3)</span></summary>
            <div className="space-y-3 border-t border-neutral-100 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[11px] text-neutral-500">Alertas y pendientes del día.</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setFiltroNotificaciones('todas')} className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition ${filtroNotificaciones === 'todas' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'}`}>Todas</button>
                  <button onClick={() => setFiltroNotificaciones('criticas')} className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition ${filtroNotificaciones === 'criticas' ? 'bg-rose-600 text-white' : 'bg-neutral-100 text-neutral-600'}`}>Críticas</button>
                  <button onClick={() => setFiltroNotificaciones('advertencias')} className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition ${filtroNotificaciones === 'advertencias' ? 'bg-amber-500 text-white' : 'bg-neutral-100 text-neutral-600'}`}>Advertencias</button>
                </div>
              </div>
              <ul className="grid gap-2 lg:grid-cols-3">
                {notificacionesFiltradas.map((item) => {
                  const severidadClasses = item.severidad === 'Crítica'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : item.severidad === 'Advertencia'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-sky-50 text-sky-700 border border-sky-200';

                  return (
                    <li key={item.id} className="rounded-2xl border border-border bg-surface p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ${severidadClasses}`}>
                          {item.severidad}
                        </span>
                        <span className="flex items-center gap-2 text-[10px] font-medium text-neutral-500">
                          {item.sinLeer ? <span className="h-2.5 w-2.5 rounded-full bg-rose-500" aria-label="Sin leer" /> : <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-label="Leída" />}
                        </span>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm font-semibold text-neutral-900">{item.titulo}</p>
                        <p className="mt-1 text-[11px] text-neutral-600">{item.descripcion}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </details>

          {mensajeBorrador && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-3 text-xs space-y-2">
              <p>{mensajeBorrador}</p>
              {borradorCargado && (
                <div className="flex gap-2">
                  <button onClick={cargarBorrador} className="bg-amber-600 text-white px-3 py-2 rounded-xl font-medium">
                    Continuar
                  </button>
                  <button onClick={limpiarBorrador} className="border border-amber-300 text-amber-700 px-3 py-2 rounded-xl font-medium">
                    Descartar
                  </button>
                </div>
              )}
            </div>
          )}

          {mostrarSelectorFichaje && clientes.length > 0 && (
            <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900">Selecciona un cliente</h3>
                  <p className="mt-1 text-[11px] text-neutral-500">El fichaje quedará asociado al cliente elegido.</p>
                </div>
                <button type="button" onClick={() => setMostrarSelectorFichaje(false)} className="text-xs text-neutral-500 hover:text-black">Cancelar</button>
              </div>
              <select
                value={clienteSeleccionado}
                onChange={(e) => setClienteSeleccionado(e.target.value)}
                className="mt-4 w-full rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-900"
              >
                <option value="">Selecciona un cliente</option>
                {clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>)}
              </select>
              <button
                type="button"
                disabled={!clienteSeleccionado}
                onClick={() => {
                  setMostrarSelectorFichaje(false);
                  setEtapa('entrada');
                }}
                className="mt-3 w-full rounded-2xl bg-black px-3 py-3 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continuar al fichaje
              </button>
            </div>
          )}

          <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                <Briefcase size={16} className="text-neutral-700" /> Clientes para Visitar / Fichar
              </h3>
              <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-medium text-neutral-600">{clientes.length} activos</span>
            </div>

            <div className="space-y-2">
              {clientes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-4 text-center text-xs text-neutral-500">
                  Agrega un cliente para comenzar a fichar.
                </div>
              ) : clientes.map((c) => {
                const historialCliente = registrosSemana.filter((r) => r.clienteId === c.id && r.completado).slice(-3);
                const horasAcumuladas = historialCliente.reduce((acc, curr) => acc + curr.totalHoras, 0);

                return (
                  <div key={c.id} className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="text-sm font-semibold text-neutral-900">{c.nombre}</h4>
                        <span className="text-[11px] text-neutral-500">Tarifa: ${c.tarifaHora}/h</span>
                      </div>
                      <button
                        onClick={() => {
                          setClienteSeleccionado(c.id);
                          setMostrarSelectorFichaje(false);
                          setEtapa('entrada');
                          setMensajeBorrador('');
                        }}
                        className="flex shrink-0 items-center gap-1.5 rounded-xl bg-black px-4 py-2 text-xs font-semibold text-white shadow hover:bg-neutral-800 transition"
                      >
                        <Clock size={13} /> Fichar
                      </button>
                    </div>

                    <div className="rounded-xl border border-neutral-200 bg-white p-2 text-[10px] text-neutral-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Historial</span>
                        <span className="font-semibold text-neutral-900">{horasAcumuladas}h</span>
                      </div>
                      {historialCliente.length > 0 ? (
                        historialCliente.map((registro) => (
                          <div key={registro.id} className="rounded-lg bg-neutral-50 p-2 text-[10px] text-neutral-500 space-y-1">
                            <div className="flex justify-between">
                              <span>{registro.fecha}</span>
                              <span>{registro.totalHoras}h</span>
                            </div>
                            {registro.actividades.length > 0 ? (
                              <div className="space-y-0.5">
                                {registro.actividades.slice(0, 2).map((actividad) => (
                                  <div key={actividad.id} className="text-[9px] text-neutral-400">
                                    • {actividad.tipo}: {actividad.descripcion}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-neutral-400">Sin actividades</span>
                            )}
                          </div>
                        ))
                      ) : (
                        <span className="text-neutral-400">Sin registros aún</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                <Clock size={16} className="text-neutral-700" /> Registros Recientes
              </h3>
              <span className="text-xs text-neutral-500">{registrosSemana.filter((r) => r.completado).length} esta semana</span>
            </div>

            <div className="space-y-2">
              {registrosSemana.filter((r) => r.completado).slice().reverse().map((registro) => {
                const cliente = clientes.find((c) => c.id === registro.clienteId);
                const esEditando = registroEditandoId === registro.id;

                return (
                  <div key={registro.id} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">{cliente?.nombre || 'Cliente'}</p>
                        <p className="text-[11px] text-neutral-500">{registro.fecha} • {registro.totalHoras}h</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => abrirEdicionRegistro(registro)}
                          className="flex items-center gap-1 rounded-xl border border-neutral-200 bg-white px-2.5 py-1.5 text-[10px] font-medium text-neutral-700"
                        >
                          <Edit3 size={12} /> Editar
                        </button>
                        <button
                          onClick={() => onEliminarRegistro(registro.id)}
                          className="rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[10px] font-medium text-rose-600"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>

                    {esEditando && registroEditando && (
                      <div className="space-y-2 rounded-2xl border border-neutral-200 bg-white p-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold uppercase tracking-wide text-neutral-600">Fecha</label>
                          <input
                            type="date"
                            min={hoy}
                            value={registroEditando.fecha}
                            onChange={(e) => setRegistroEditando({ ...registroEditando, fecha: e.target.value })}
                            className="w-full rounded-xl border border-neutral-200 p-2 text-xs"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold uppercase tracking-wide text-neutral-600">Hora entrada</label>
                            <input
                              type="time"
                              value={registroEditando.horaEntrada}
                              onChange={(e) => setRegistroEditando({ ...registroEditando, horaEntrada: e.target.value })}
                              className="w-full rounded-xl border border-neutral-200 p-2 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold uppercase tracking-wide text-neutral-600">Horas</label>
                            <select
                              value={registroEditando.totalHoras}
                              onChange={(e) => setRegistroEditando({ ...registroEditando, totalHoras: Number(e.target.value) })}
                              className="w-full rounded-xl border border-neutral-200 p-2 text-xs"
                            >
                              <option value={1}>1 hora</option>
                              <option value={8}>8 horas</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-semibold uppercase tracking-wide text-neutral-600">Actividades</label>
                          {registroEditando.actividades.map((actividad, index) => (
                            <div key={actividad.id} className="flex items-center gap-2">
                              <input
                                value={actividad.descripcion}
                                onChange={(e) => {
                                  const nuevas = [...registroEditando.actividades];
                                  nuevas[index] = { ...nuevas[index], descripcion: e.target.value };
                                  setRegistroEditando({ ...registroEditando, actividades: nuevas });
                                }}
                                className="flex-1 rounded-xl border border-neutral-200 p-2 text-xs"
                              />
                              <button
                                onClick={() => eliminarActividadEdicion(index)}
                                className="rounded-xl border border-neutral-200 px-2 py-2 text-[10px] text-neutral-600"
                              >
                                X
                              </button>
                            </div>
                          ))}
                          <div className="flex gap-2">
                            <input
                              value={descripcionEdicion}
                              onChange={(e) => setDescripcionEdicion(e.target.value)}
                              placeholder="Nueva actividad"
                              className="flex-1 rounded-xl border border-neutral-200 p-2 text-xs"
                            />
                            <button
                              onClick={agregarActividadEdicion}
                              className="rounded-xl bg-black px-3 py-2 text-[10px] font-medium text-white"
                            >
                              Añadir
                            </button>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setRegistroEditandoId(null);
                              setRegistroEditando(null);
                            }}
                            className="flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-[10px] font-medium text-neutral-700"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={guardarEdicionRegistro}
                            className="flex-1 rounded-xl bg-emerald-600 px-3 py-2 text-[10px] font-medium text-white"
                          >
                            Guardar cambios
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {etapa === 'entrada' && (
        <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Clock className="text-black" size={18} /> Registro de Entrada
            </h2>
            <button onClick={() => setEtapa('inicio')} className="text-xs text-neutral-500 hover:text-black underline">
              ← Volver
            </button>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 space-y-2">
            <label className="block text-[11px] font-semibold text-neutral-700">Fecha del registro</label>
            <input
              type="date"
              min={hoy}
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              className="w-full p-2.5 border border-neutral-200 rounded-xl text-xs bg-white text-neutral-800"
            />
            <p className="text-[10px] text-neutral-500">Puedes elegir hoy o una fecha futura para este registro.</p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 space-y-2">
            <label className="block text-[11px] font-semibold text-neutral-700">Duración de la jornada</label>
            <select
              value={duracionHoras}
              onChange={(e) => setDuracionHoras(Number(e.target.value))}
              className="w-full p-2.5 border border-neutral-200 rounded-xl text-xs bg-white text-neutral-800"
            >
              <option value={1}>1 hora</option>
              <option value={8}>8 horas</option>
            </select>
            <p className="text-[10px] text-neutral-500">Selecciona si trabajarás 1 hora o 8 horas para este registro.</p>
          </div>

          <div className="border-2 border-dashed border-neutral-200 rounded-2xl p-6 text-center bg-neutral-50/50">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              id="foto-entrada"
              className="hidden"
              onChange={(e) => handleCapturaFoto('entrada', e)}
            />
            <label htmlFor="foto-entrada" className="cursor-pointer flex flex-col items-center gap-2">
              <div className="p-3.5 bg-black text-white rounded-full shadow-md">
                <Camera size={22} />
              </div>
              <span className="text-xs font-semibold text-neutral-900">Tomar Foto de Entrada (Validar Wi-Fi)</span>
              <span className="text-[10px] text-neutral-500">Extrae la hora y verifica ubicación local</span>
            </label>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                guardarBorrador('entrada');
                setEtapa('inicio');
              }}
              className="flex-1 border border-neutral-300 text-neutral-700 py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-2"
            >
              <Save size={14} /> Guardar para más tarde
            </button>
            <button
              onClick={() => setEtapa('trabajando')}
              className="flex-1 bg-black text-white py-2.5 rounded-xl text-xs font-medium shadow hover:bg-neutral-800 transition"
            >
              Continuar
            </button>
          </div>

          {horaEntrada && (
            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 text-xs space-y-2">
              <p className="text-neutral-900 font-medium flex items-center gap-1.5">
                <CheckCircle size={15} className="text-emerald-600" /> Entrada registrada a las: {horaEntrada}
              </p>
              <p className="text-neutral-600 flex items-center gap-1.5">
                <Wifi size={15} className="text-emerald-600" /> Red Wi-Fi del lugar verificada con éxito.
              </p>
            </div>
          )}
        </div>
      )}

      {etapa === 'trabajando' && (
        <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-sm space-y-4">
          <div className="bg-neutral-100 p-3.5 rounded-2xl flex justify-between items-center">
            <span className="text-xs font-semibold text-neutral-900">Jornada Activa en Curso</span>
            <button
              onClick={() => setEtapa('break')}
              className="text-xs bg-amber-500 text-white px-3 py-1.5 rounded-xl font-medium flex items-center gap-1 shadow-sm"
            >
              <Coffee size={13} /> Break (30m)
            </button>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-600">
            <div className="flex justify-between">
              <span>Duración seleccionada</span>
              <span className="font-semibold text-neutral-900">{duracionHoras}h</span>
            </div>
          </div>

          <div className="space-y-3 border-t border-neutral-100 pt-3">
            <h3 className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">Añadir Actividad (Grid)</h3>
            <div className="flex gap-2">
              <select
                className="p-2.5 border border-neutral-200 rounded-xl text-xs bg-neutral-50 text-neutral-800"
                value={tipoActividad}
                onChange={(e) => setTipoActividad(e.target.value as Actividad['tipo'])}
              >
                <option value="video">Video</option>
                <option value="foto">Foto</option>
                <option value="asesoria">Asesoría</option>
                <option value="otro">Otro</option>
              </select>
              <input
                type="text"
                placeholder="Ej. Nombre del video"
                className="flex-1 p-2.5 border border-neutral-200 rounded-xl text-xs bg-neutral-50"
                value={descripcionActividad}
                onChange={(e) => setDescripcionActividad(e.target.value)}
              />
            </div>
            <button
              onClick={agregarActividad}
              className="w-full bg-neutral-900 text-white py-2.5 rounded-xl text-xs font-medium shadow hover:bg-black transition"
            >
              Agregar a la lista
            </button>
          </div>

          <div className="space-y-2 max-h-36 overflow-y-auto">
            {listaActividades.map((act) => (
              <div key={act.id} className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-100 text-xs flex justify-between items-center">
                <span className="font-bold uppercase text-neutral-900">{act.tipo}</span>
                <span className="text-neutral-600">{act.descripcion}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                guardarBorrador('trabajando');
                setEtapa('inicio');
              }}
              className="flex-1 border border-neutral-300 text-neutral-700 py-3 rounded-xl text-xs font-medium flex items-center justify-center gap-2"
            >
              <Save size={14} /> Guardar y salir
            </button>
            <button
              onClick={finalizarJornada}
              className="flex-1 bg-rose-600 text-white py-3 rounded-xl font-medium text-xs shadow hover:bg-rose-700 transition flex items-center justify-center gap-2"
            >
              <Square size={15} /> Finalizar
            </button>
          </div>
        </div>
      )}

      {etapa === 'finalizado' && (
        <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm text-center space-y-4 py-8">
          <CheckCircle className="mx-auto text-emerald-600" size={48} />
          <h3 className="text-lg font-bold text-neutral-900">¡Jornada Registrada con Éxito!</h3>
          <p className="text-xs text-neutral-500">Tus horas y actividades se han sumado al acumulado semanal.</p>
          <button
            onClick={() => {
              setEtapa('inicio');
              setClienteSeleccionado('');
              setListaActividades([]);
              setHoraEntrada('');
              setDuracionHoras(8);
              setDescripcionActividad('');
            }}
            className="w-full bg-black text-white py-3 rounded-xl text-sm font-medium shadow"
          >
            Volver al Inicio
          </button>
        </div>
      )}

      {etapa === 'break' && (
        <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm text-center space-y-4 py-8">
          <Coffee className="mx-auto text-amber-500" size={48} />
          <h3 className="text-lg font-bold text-neutral-900">En Break (30 minutos)</h3>
          <p className="text-xs text-neutral-500">Descansa tu jornada. Cuando regreses, retoma tus tareas.</p>
          <div className="flex gap-2">
            <button
              onClick={() => setEtapa('trabajando')}
              className="flex-1 bg-black text-white py-3 rounded-xl text-sm font-medium shadow"
            >
              Retomar Jornada
            </button>
            <button
              onClick={() => {
                guardarBorrador('break');
                setEtapa('inicio');
              }}
              className="flex-1 border border-neutral-300 text-neutral-700 py-3 rounded-xl text-sm font-medium"
            >
              <RotateCcw size={14} className="inline mr-1" /> Guardar y salir
            </button>
          </div>
        </div>
      )}
    </div>
  );
};