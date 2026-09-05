import { useEffect, useState, type FormEvent } from 'react';
import { Fichaje } from './components/Fichaje';
import { GeneradorFactura } from './components/GeneradorFactura';
import { SolicitudesCliente } from './components/SolicitudesCliente';
import { VistaPublica } from './components/VistaPublica';
import type { Cliente, RegistroJornada, Factura, SolicitudPresupuesto } from './types';
import { Clock, FileText, Users, LogOut, Plus, Briefcase, Download, Upload, Sparkles, CalendarDays } from 'lucide-react';

const CLIENTES_DE_EJEMPLO = ['Intercenter Colombia', 'DICA CASTELL'];
const STORAGE_KEY = 'carper-app-data';
const DB_NAME = 'carper-db';
const STORE_NAME = 'app-state';
const DB_VERSION = 1;

type DatosPersistidos = {
  clientes: Cliente[];
  registros: RegistroJornada[];
  facturas: Factura[];
  solicitudes: SolicitudPresupuesto[];
  updatedAt: string;
};

const crearDatosPersistidos = (datos: Omit<DatosPersistidos, 'updatedAt'>): DatosPersistidos => ({
  ...datos,
  updatedAt: new Date().toISOString()
});

const leerDesdeStorage = <T,>(key: string, fallback: T[]): T[] => {
  if (typeof window === 'undefined') return fallback;

  const saved = window.localStorage.getItem(key);
  if (!saved) return fallback;

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
};

const leerDatosPersistidos = (): DatosPersistidos => {
  if (typeof window === 'undefined') {
    return crearDatosPersistidos({ clientes: [], registros: [], facturas: [], solicitudes: [] });
  }

  const fuentes = [
    window.localStorage.getItem(STORAGE_KEY),
    window.sessionStorage.getItem(STORAGE_KEY),
    window.localStorage.getItem('carper-clientes') ? JSON.stringify({ clientes: leerDesdeStorage<Cliente>('carper-clientes', []), registros: leerDesdeStorage<RegistroJornada>('carper-registros', []), facturas: leerDesdeStorage<Factura>('carper-facturas', []) }) : null
  ].filter(Boolean) as string[];

  for (const fuente of fuentes) {
    try {
      const parsed = JSON.parse(fuente) as Partial<DatosPersistidos>;
      if (parsed && Array.isArray(parsed.clientes) && Array.isArray(parsed.registros) && Array.isArray(parsed.facturas)) {
        return crearDatosPersistidos({
          clientes: parsed.clientes as Cliente[],
          registros: parsed.registros as RegistroJornada[],
          facturas: parsed.facturas as Factura[],
          solicitudes: (parsed.solicitudes as SolicitudPresupuesto[] | undefined) ?? []
        });
      }
    } catch {
      // Se intenta migrar desde claves antiguas.
    }
  }

  return crearDatosPersistidos({
    clientes: leerDesdeStorage<Cliente>('carper-clientes', []),
    registros: leerDesdeStorage<RegistroJornada>('carper-registros', []),
    facturas: leerDesdeStorage<Factura>('carper-facturas', []),
    solicitudes: leerDesdeStorage<SolicitudPresupuesto>('carper-solicitudes', [])
  });
};

const guardarDatosPersistidos = (datos: Omit<DatosPersistidos, 'updatedAt'>) => {
  if (typeof window === 'undefined') return;

  const payload = crearDatosPersistidos(datos);
  const texto = JSON.stringify(payload);

  window.localStorage.setItem(STORAGE_KEY, texto);
  window.localStorage.setItem('carper-clientes', JSON.stringify(payload.clientes));
  window.localStorage.setItem('carper-registros', JSON.stringify(payload.registros));
  window.localStorage.setItem('carper-facturas', JSON.stringify(payload.facturas));
  window.localStorage.setItem('carper-solicitudes', JSON.stringify(payload.solicitudes));

  try {
    window.sessionStorage.setItem(STORAGE_KEY, texto);
  } catch {
    // Ignoramos fallas en sessionStorage.
  }

  if ('indexedDB' in window) {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => {
      // Si IndexedDB falla, se queda con el guardado local.
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(payload, 'state');
    };
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  }
};

const leerDesdeIndexedDB = async (): Promise<DatosPersistidos | null> => {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return null;
  }

  return new Promise((resolve) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => resolve(null);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get('state');
      getReq.onsuccess = () => {
        const value = getReq.result as DatosPersistidos | undefined;
        resolve(value ?? null);
      };
      getReq.onerror = () => resolve(null);
    };
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

export function App() {
  const [autenticado, setAutenticado] = useState<boolean>(false);
  const [usuario, setUsuario] = useState<string>('');
  const [clave, setClave] = useState<string>('');
  const [errorLogin, setErrorLogin] = useState<string>('');
  const [mostrarLogin, setMostrarLogin] = useState(false);

  const [pestanaActiva, setPestanaActiva] = useState<'fichaje' | 'facturas' | 'clientes' | 'solicitudes'>('fichaje');
  const [modoDocumento, setModoDocumento] = useState<'factura' | 'presupuesto'>('factura');

  const [clientes, setClientes] = useState<Cliente[]>(() => {
    const guardados = leerDatosPersistidos();
    return guardados.clientes.filter((cliente) => !CLIENTES_DE_EJEMPLO.includes(cliente.nombre));
  });

  const [registros, setRegistros] = useState<RegistroJornada[]>(() => {
    return leerDatosPersistidos().registros;
  });

  const [facturas, setFacturas] = useState<Factura[]>(() => {
    return leerDatosPersistidos().facturas;
  });

  const [solicitudes, setSolicitudes] = useState<SolicitudPresupuesto[]>(() => {
    return leerDatosPersistidos().solicitudes;
  });

  const [nuevoClienteNombre, setNuevoClienteNombre] = useState<string>('');
  const [nuevaTarifa, setNuevaTarifa] = useState<number>(20);

  useEffect(() => {
    const sanitizados = clientes.filter((cliente) => !CLIENTES_DE_EJEMPLO.includes(cliente.nombre));

    if (sanitizados.length !== clientes.length) {
      setClientes(sanitizados);
      guardarDatosPersistidos({ clientes: sanitizados, registros, facturas, solicitudes });
      return;
    }

    guardarDatosPersistidos({ clientes, registros, facturas, solicitudes });
  }, [clientes, registros, facturas, solicitudes]);

  useEffect(() => {
    let activo = true;

    const cargarDatos = async () => {
      const datosDesdeDb = await leerDesdeIndexedDB();
      if (!activo) return;

      const datos = datosDesdeDb ?? leerDatosPersistidos();
      const clientesLimpios = datos.clientes.filter((cliente) => !CLIENTES_DE_EJEMPLO.includes(cliente.nombre));
      setClientes(clientesLimpios);
      setRegistros(datos.registros);
      setFacturas(datos.facturas);
      setSolicitudes(datos.solicitudes ?? []);
    };

    void cargarDatos();

    if (typeof window === 'undefined') return;

    const onStorage = (event: StorageEvent) => {
      if (event.key && event.key !== STORAGE_KEY && event.key !== 'carper-clientes' && event.key !== 'carper-registros' && event.key !== 'carper-facturas' && event.key !== 'carper-solicitudes') {
        return;
      }

      const datos = leerDatosPersistidos();
      const clientesLimpios = datos.clientes.filter((cliente) => !CLIENTES_DE_EJEMPLO.includes(cliente.nombre));
      setClientes(clientesLimpios);
      setRegistros(datos.registros);
      setFacturas(datos.facturas);
      setSolicitudes(datos.solicitudes ?? []);
    };

    window.addEventListener('storage', onStorage);
    return () => {
      activo = false;
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (usuario.trim() && clave.trim()) {
      setAutenticado(true);
      setErrorLogin('');
    } else {
      setErrorLogin('Por favor ingresa tu nombre y clave');
    }
  };

  const handleAgregarCliente = (e: FormEvent) => {
    e.preventDefault();
    if (!nuevoClienteNombre.trim()) return;

    const nuevo: Cliente = {
      id: Date.now().toString(),
      nombre: nuevoClienteNombre.trim(),
      tarifaHora: nuevaTarifa,
      tipoCobro: 'hora'
    };

    setClientes((prev) => [...prev, nuevo]);
    setNuevoClienteNombre('');
  };

  const handleActualizarRegistro = (registroActualizado: RegistroJornada) => {
    setRegistros((prev) =>
      prev.map((registro) => (registro.id === registroActualizado.id ? registroActualizado : registro))
    );
  };

  const handleEliminarRegistro = (registroId: string) => {
    const confirmar = window.confirm('¿Seguro que deseas eliminar este registro?');
    if (!confirmar) return;

    const registroEliminado = registros.find((registro) => registro.id === registroId);

    setRegistros((prev) => prev.filter((registro) => registro.id !== registroId));
    setFacturas((prev) =>
      prev.filter((factura) => !factura.registrosIds.includes(registroId))
    );

    if (registroEliminado) {
      const borrador = window.localStorage.getItem('carper-draft-registro');
      if (borrador) {
        try {
          const draft = JSON.parse(borrador);
          if (draft.clienteId === registroEliminado.clienteId) {
            window.localStorage.removeItem('carper-draft-registro');
          }
        } catch {
          // Ignoramos errores al limpiar el borrador.
        }
      }
    }
  };

  const handleEliminarCliente = (clienteId: string) => {
    const nombreCliente = clientes.find((cliente) => cliente.id === clienteId)?.nombre || 'este cliente';
    const confirmar = window.confirm(`¿Seguro que deseas eliminar a ${nombreCliente} y todos sus registros asociados?`);

    if (!confirmar) return;

    const registrosRestantes = registros.filter((registro) => registro.clienteId !== clienteId);
    const facturasRestantes = facturas.filter((factura) => factura.clienteId !== clienteId);

    setClientes((prev) => prev.filter((cliente) => cliente.id !== clienteId));
    setRegistros(registrosRestantes);
    setFacturas(facturasRestantes);

    const borrador = window.localStorage.getItem('carper-draft-registro');
    if (borrador) {
      try {
        const draft = JSON.parse(borrador);
        if (draft.clienteId === clienteId) {
          window.localStorage.removeItem('carper-draft-registro');
        }
      } catch {
        // Ignoramos errores al limpiar el borrador.
      }
    }
  };

  const limpiarDatos = () => {
    if (window.confirm('¿Deseas limpiar solo los registros y facturas, manteniendo los clientes?')) {
      setRegistros([]);
      setFacturas([]);
      guardarDatosPersistidos({ clientes, registros: [], facturas: [], solicitudes });
    }
  };

  const exportarDatos = () => {
    const payload = JSON.stringify(crearDatosPersistidos({ clientes, registros, facturas, solicitudes }), null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `carper-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleAgregarSolicitud = (solicitud: SolicitudPresupuesto) => {
    setSolicitudes((prev) => [solicitud, ...prev]);
  };

  const handleActualizarSolicitud = (
    id: string,
    estado: SolicitudPresupuesto['estado'],
    reunionDetalles?: { reunionFecha?: string; reunionHora?: string; reunionNotas?: string }
  ) => {
    setSolicitudes((prev) =>
      prev.map((solicitud) =>
        solicitud.id === id
          ? {
              ...solicitud,
              estado,
              reunionFecha: reunionDetalles?.reunionFecha ?? solicitud.reunionFecha,
              reunionHora: reunionDetalles?.reunionHora ?? solicitud.reunionHora,
              reunionNotas: reunionDetalles?.reunionNotas ?? solicitud.reunionNotas
            }
          : solicitud
      )
    );
  };

  const importarDatos = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0];
    if (!archivo) return;

    try {
      const texto = await archivo.text();
      const parsed = JSON.parse(texto) as Partial<DatosPersistidos>;
      if (!parsed || !Array.isArray(parsed.clientes) || !Array.isArray(parsed.registros) || !Array.isArray(parsed.facturas)) {
        window.alert('El archivo no tiene el formato correcto.');
        return;
      }

      const datos = crearDatosPersistidos({
        clientes: parsed.clientes as Cliente[],
        registros: parsed.registros as RegistroJornada[],
        facturas: parsed.facturas as Factura[],
        solicitudes: (parsed.solicitudes as SolicitudPresupuesto[] | undefined) ?? []
      });

      setClientes(datos.clientes);
      setRegistros(datos.registros);
      setFacturas(datos.facturas);
      setSolicitudes(datos.solicitudes ?? []);
      guardarDatosPersistidos({ clientes: datos.clientes, registros: datos.registros, facturas: datos.facturas, solicitudes: datos.solicitudes ?? [] });
      window.alert('Datos importados correctamente.');
    } catch {
      window.alert('No se pudo leer el archivo.');
    } finally {
      event.target.value = '';
    }
  };

  const reunionesAgendadas = [...solicitudes]
    .filter((solicitud) => solicitud.estado === 'agendado' && solicitud.reunionFecha)
    .sort((a, b) => {
      const fechaComparacion = (a.reunionFecha ?? '').localeCompare(b.reunionFecha ?? '');
      if (fechaComparacion !== 0) return fechaComparacion;
      return (a.reunionHora ?? '').localeCompare(b.reunionHora ?? '');
    });

  if (!autenticado && !mostrarLogin) {
    return <VistaPublica onEnviarSolicitud={handleAgregarSolicitud} onAcceder={() => setMostrarLogin(true)} />;
  }

  if (!autenticado) {
    return (
      <div className="min-h-screen bg-black flex flex-col justify-center items-center p-6 text-white font-sans antialiased">
        <div className="w-full max-w-sm space-y-8 bg-neutral-900 p-8 rounded-3xl border border-neutral-800 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-white mx-auto rounded-2xl flex items-center justify-center shadow-inner overflow-hidden border border-neutral-700">
              <img
                src="/icons.svg"
                alt="Logo CARPER"
                className="w-10 h-10 object-contain"
              />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">CARPER</h1>
            <p className="text-xs text-neutral-400">Control de Horas & Facturación Profesional</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {errorLogin && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl text-center">
                {errorLogin}
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Usuario / Nombre</label>
              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="Ej. Karelys"
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-white transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Clave de Acceso</label>
              <input
                type="password"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-white transition"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 bg-white text-black font-medium text-sm rounded-xl hover:bg-neutral-200 transition shadow-lg active:scale-95"
            >
              Iniciar Sesión
            </button>
          </form>
          <button type="button" onClick={() => setMostrarLogin(false)} className="w-full text-xs font-medium text-neutral-400 transition hover:text-white">Volver a la vista pública</button>
          <p className="text-[10px] text-center text-neutral-600">Sistema Local Seguro • iPhone 12 Optimized</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFD] text-neutral-900 font-sans antialiased pb-28">
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-neutral-200 px-4 py-3.5 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center overflow-hidden border border-neutral-200">
            <img
              src="/icons.svg"
              alt="Logo CARPER"
              className="w-5 h-5 object-contain"
            />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-neutral-900 leading-none">CARPER</h2>
            <span className="text-[10px] text-emerald-600 font-medium">● Local Activo</span>
          </div>
        </div>
        <button
          onClick={() => setAutenticado(false)}
          className="p-2 text-neutral-500 hover:text-black rounded-full hover:bg-neutral-100 transition"
          title="Cerrar Sesión"
        >
          <LogOut size={16} />
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-6 pb-24 lg:px-8">
        {pestanaActiva === 'fichaje' && (
          <Fichaje
            clientes={clientes}
            registros={registros}
            onGuardarRegistro={(nuevoReg: RegistroJornada) => {
              setRegistros((prev) => [...prev, nuevoReg]);
            }}
            onActualizarRegistro={handleActualizarRegistro}
            onEliminarRegistro={handleEliminarRegistro}
            onAbrirClientes={() => setPestanaActiva('clientes')}
            onAbrirPresupuestos={() => {
              setModoDocumento('presupuesto');
              setPestanaActiva('facturas');
            }}
          />
        )}

        {pestanaActiva === 'facturas' && (
          <GeneradorFactura
            clientes={clientes}
            registros={registros}
            modoDocumento={modoDocumento}
            onCambiarModoDocumento={setModoDocumento}
            onGuardarFactura={(nuevaFac: Factura) => {
              setFacturas((prev) => [...prev, nuevaFac]);
            }}
          />
        )}

        {pestanaActiva === 'solicitudes' && (
          <div className="space-y-4 my-4">
            <SolicitudesCliente solicitudes={solicitudes} onActualizarEstado={handleActualizarSolicitud} />

            <div className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <CalendarDays size={16} className="text-black" />
                <h3 className="text-sm font-semibold text-neutral-900">Agenda de reuniones</h3>
              </div>

              {reunionesAgendadas.length === 0 ? (
                <div className="mt-3 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-4 text-center text-[11px] text-neutral-500">
                  No hay reuniones agendadas todavía.
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {reunionesAgendadas.map((solicitud) => (
                    <div key={solicitud.id} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-[11px] text-neutral-700">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-neutral-900">{solicitud.nombreCliente}</p>
                          <p className="mt-1">{solicitud.correo}</p>
                        </div>
                        <span className="rounded-full bg-sky-100 px-2 py-1 text-[10px] font-semibold text-sky-700">
                          {solicitud.reunionFecha}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white px-2 py-1">{solicitud.reunionHora}</span>
                        <span className="rounded-full bg-white px-2 py-1">{solicitud.tipoServicio}</span>
                      </div>
                      {solicitud.reunionNotas && <p className="mt-2 text-neutral-600">{solicitud.reunionNotas}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {pestanaActiva === 'clientes' && (
          <div className="space-y-4 my-4">
            <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-sm space-y-4">
              <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                <Briefcase size={18} className="text-neutral-800" /> Gestión de Clientes
              </h3>

              <form onSubmit={handleAgregarCliente} className="space-y-3 pt-2 border-t border-neutral-100">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Nombre del Cliente / Empresa</label>
                  <input
                    type="text"
                    placeholder="Ej. Marca o Cliente X"
                    value={nuevoClienteNombre}
                    onChange={(e) => setNuevoClienteNombre(e.target.value)}
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Tarifa por Hora ($)</label>
                  <input
                    type="number"
                    value={nuevaTarifa}
                    onChange={(e) => setNuevaTarifa(Number(e.target.value))}
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs focus:outline-none focus:border-black"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-black text-white py-3 rounded-2xl text-xs font-medium shadow hover:bg-neutral-800 transition flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Registrar Cliente
                </button>
              </form>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Clientes Guardados</h4>
                <button
                  onClick={limpiarDatos}
                  className="text-[10px] text-rose-600 font-medium underline decoration-rose-300 leading-snug text-left"
                >
                  Vaciar registros y facturas (mantener clientes)
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={exportarDatos}
                  className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-[11px] font-medium text-neutral-700"
                >
                  <Download size={14} /> Exportar datos
                </button>
                <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-[11px] font-medium text-neutral-700">
                  <Upload size={14} /> Importar datos
                  <input type="file" accept="application/json" className="hidden" onChange={importarDatos} />
                </label>
              </div>

              <div className="space-y-2">
                {clientes.map((c) => (
                  <div key={c.id} className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100 flex flex-wrap justify-between items-center gap-2 text-xs">
                    <span className="font-semibold text-neutral-900">{c.nombre}</span>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-white border border-neutral-200 rounded-xl text-neutral-700 font-medium">
                        ${c.tarifaHora}/h
                      </span>
                      <button
                        onClick={() => handleEliminarCliente(c.id)}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[10px] font-medium text-rose-600 hover:bg-rose-100"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-neutral-200 bg-white/95 backdrop-blur-xl shadow-[0_-8px_24px_rgba(0,0,0,0.06)]">
        <div className="mx-auto flex max-w-7xl items-center justify-around px-3 py-2">
          <button
            onClick={() => setPestanaActiva('fichaje')}
            className={`flex flex-1 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[10px] leading-tight transition ${pestanaActiva === 'fichaje' ? 'bg-black text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800'}`}
          >
            <Clock size={18} />
            <span>Fichaje</span>
          </button>

          <button
            onClick={() => setPestanaActiva('facturas')}
            className={`flex flex-1 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[10px] leading-tight transition ${pestanaActiva === 'facturas' ? 'bg-black text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800'}`}
          >
            <FileText size={18} />
            <span>Facturas</span>
          </button>

          <button
            onClick={() => setPestanaActiva('solicitudes')}
            className={`flex flex-1 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[10px] leading-tight transition ${pestanaActiva === 'solicitudes' ? 'bg-black text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800'}`}
          >
            <Sparkles size={18} />
            <span>Solicitudes</span>
          </button>

          <button
            onClick={() => setPestanaActiva('clientes')}
            className={`flex flex-1 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[10px] leading-tight transition ${pestanaActiva === 'clientes' ? 'bg-black text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800'}`}
          >
            <Users size={18} />
            <span>Clientes</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
