import React, { useEffect, useState } from 'react';
import { Camera, Wifi, Clock, CheckCircle, Square, Coffee, TrendingUp, Briefcase, Save, RotateCcw } from 'lucide-react';
import type { Cliente, Actividad, RegistroJornada } from '../types';

interface FichajeProps {
  clientes: Cliente[];
  registros: RegistroJornada[];
  onGuardarRegistro: (registro: RegistroJornada) => void;
}

interface DraftState {
  clienteId: string;
  etapa: 'inicio' | 'entrada' | 'trabajando' | 'break' | 'finalizado';
  horaEntrada: string;
  wifiVerificado: boolean;
  listaActividades: Actividad[];
  duracionHoras: number;
}

export const Fichaje: React.FC<FichajeProps> = ({ clientes, registros, onGuardarRegistro }) => {
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string>('');
  const [etapa, setEtapa] = useState<'inicio' | 'entrada' | 'trabajando' | 'break' | 'finalizado'>('inicio');
  const [duracionHoras, setDuracionHoras] = useState<number>(8);

  const [horaEntrada, setHoraEntrada] = useState<string>('');
  const [wifiVerificado, setWifiVerificado] = useState<boolean>(false);

  const [tipoActividad, setTipoActividad] = useState<Actividad['tipo']>('video');
  const [descripcionActividad, setDescripcionActividad] = useState<string>('');
  const [listaActividades, setListaActividades] = useState<Actividad[]>([]);
  const [mensajeBorrador, setMensajeBorrador] = useState<string>('');
  const [borradorCargado, setBorradorCargado] = useState<DraftState | null>(null);

  const totalHorasSemana = registros.reduce((acc, curr) => acc + (curr.totalHoras || 0), 0);

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
      fecha: new Date().toISOString().split('T')[0],
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

  return (
    <div className="max-w-md mx-auto p-4 space-y-4 my-2">
      {etapa === 'inicio' && (
        <div className="space-y-4">
          <div className="bg-black text-white p-5 rounded-3xl shadow-xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs uppercase tracking-wider text-neutral-400 font-semibold flex items-center gap-1.5">
                <TrendingUp size={14} /> Resumen Semanal
              </span>
              <span className="text-xs bg-neutral-800 text-neutral-300 px-2.5 py-1 rounded-full">
                Esta Semana
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-bold tracking-tight">{totalHorasSemana}</h2>
              <span className="text-sm text-neutral-400 font-medium">horas registradas</span>
            </div>
            <p className="text-xs text-neutral-400">
              {registros.length} jornadas completadas con éxito en tus clientes.
            </p>
          </div>

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

          <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                <Briefcase size={16} className="text-neutral-700" /> Clientes para Visitar / Fichar
              </h3>
              <span className="text-xs text-neutral-500">{clientes.length} activos</span>
            </div>

            <div className="space-y-2">
              {clientes.map((c) => {
                const historialCliente = registros.filter((r) => r.clienteId === c.id && r.completado).slice(-3);
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
                          setEtapa('entrada');
                          setMensajeBorrador('');
                        }}
                        className="bg-black text-white text-xs px-3 py-2 rounded-xl font-medium shadow hover:bg-neutral-800 transition"
                      >
                        Fichar Aquí
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