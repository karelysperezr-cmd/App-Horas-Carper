import { useEffect, useState, type FormEvent } from 'react';
import { Fichaje } from './components/Fichaje';
import { GeneradorFactura } from './components/GeneradorFactura';
import type { Cliente, RegistroJornada, Factura } from './types';
import { Clock, FileText, Users, LogOut, Plus, Briefcase } from 'lucide-react';

const CLIENTES_DE_EJEMPLO = ['Intercenter Colombia', 'DICA CASTELL'];

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

export function App() {
  const [autenticado, setAutenticado] = useState<boolean>(false);
  const [usuario, setUsuario] = useState<string>('');
  const [clave, setClave] = useState<string>('');
  const [errorLogin, setErrorLogin] = useState<string>('');

  const [pestanaActiva, setPestanaActiva] = useState<'fichaje' | 'facturas' | 'clientes'>('fichaje');

  const [clientes, setClientes] = useState<Cliente[]>(() => {
    const guardados = leerDesdeStorage<Cliente>('carper-clientes', []);
    return guardados.filter((cliente) => !CLIENTES_DE_EJEMPLO.includes(cliente.nombre));
  });

  const [registros, setRegistros] = useState<RegistroJornada[]>(() => {
    return leerDesdeStorage<RegistroJornada>('carper-registros', []);
  });

  const [facturas, setFacturas] = useState<Factura[]>(() => {
    return leerDesdeStorage<Factura>('carper-facturas', []);
  });

  const [nuevoClienteNombre, setNuevoClienteNombre] = useState<string>('');
  const [nuevaTarifa, setNuevaTarifa] = useState<number>(20);

  useEffect(() => {
    const sanitizados = clientes.filter((cliente) => !CLIENTES_DE_EJEMPLO.includes(cliente.nombre));

    if (sanitizados.length !== clientes.length) {
      setClientes(sanitizados);
      window.localStorage.setItem('carper-clientes', JSON.stringify(sanitizados));
      return;
    }

    window.localStorage.setItem('carper-clientes', JSON.stringify(clientes));
  }, [clientes]);

  useEffect(() => {
    window.localStorage.setItem('carper-registros', JSON.stringify(registros));
  }, [registros]);

  useEffect(() => {
    window.localStorage.setItem('carper-facturas', JSON.stringify(facturas));
  }, [facturas]);

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
      nombre: nuevoClienteNombre,
      tarifaHora: nuevaTarifa,
      tipoCobro: 'hora'
    };

    setClientes([...clientes, nuevo]);
    setNuevoClienteNombre('');
  };

  const handleActualizarRegistro = (registroActualizado: RegistroJornada) => {
    setRegistros((prev) =>
      prev.map((registro) => (registro.id === registroActualizado.id ? registroActualizado : registro))
    );
  };

  const limpiarDatos = () => {
    if (window.confirm('¿Deseas limpiar solo los registros y facturas, manteniendo los clientes?')) {
      setRegistros([]);
      setFacturas([]);
      window.localStorage.setItem('carper-registros', JSON.stringify([]));
      window.localStorage.setItem('carper-facturas', JSON.stringify([]));
    }
  };

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
          <p className="text-[10px] text-center text-neutral-600">Sistema Local Seguro • iPhone 12 Optimized</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFD] text-neutral-900 font-sans antialiased pb-28">
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-neutral-200 px-4 py-3.5 flex justify-between items-center max-w-md mx-auto">
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

      <main className="max-w-md mx-auto px-4 pt-6 pb-24">
        {pestanaActiva === 'fichaje' && (
          <Fichaje
            clientes={clientes}
            registros={registros}
            onGuardarRegistro={(nuevoReg: RegistroJornada) => {
              setRegistros([...registros, nuevoReg]);
            }}
            onActualizarRegistro={handleActualizarRegistro}
          />
        )}

        {pestanaActiva === 'facturas' && (
          <GeneradorFactura
            clientes={clientes}
            registros={registros}
            onGuardarFactura={(nuevaFac: Factura) => {
              setFacturas([...facturas, nuevaFac]);
            }}
          />
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
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Clientes Guardados</h4>
                <button
                  onClick={limpiarDatos}
                  className="text-[10px] text-rose-600 font-medium underline decoration-rose-300"
                >
                  Vaciar registros y facturas (mantener clientes)
                </button>
              </div>
              <div className="space-y-2">
                {clientes.map((c) => (
                  <div key={c.id} className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100 flex justify-between items-center text-xs">
                    <span className="font-semibold text-neutral-900">{c.nombre}</span>
                    <span className="px-2.5 py-1 bg-white border border-neutral-200 rounded-xl text-neutral-700 font-medium">
                      ${c.tarifaHora}/h
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-neutral-200 bg-white/95 backdrop-blur-xl shadow-[0_-8px_24px_rgba(0,0,0,0.06)]">
        <div className="mx-auto flex max-w-md items-center justify-around px-3 py-2">
          <button
            onClick={() => setPestanaActiva('fichaje')}
            className={`flex min-w-[70px] flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[10px] transition ${pestanaActiva === 'fichaje' ? 'bg-black text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800'}`}
          >
            <Clock size={18} />
            <span>Fichaje</span>
          </button>

          <button
            onClick={() => setPestanaActiva('facturas')}
            className={`flex min-w-[70px] flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[10px] transition ${pestanaActiva === 'facturas' ? 'bg-black text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800'}`}
          >
            <FileText size={18} />
            <span>Facturas</span>
          </button>

          <button
            onClick={() => setPestanaActiva('clientes')}
            className={`flex min-w-[70px] flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[10px] transition ${pestanaActiva === 'clientes' ? 'bg-black text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800'}`}
          >
            <Users size={18} />
            <span>Clientes</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
