export interface Cliente {
  id: string;
  nombre: string;
  tarifaHora: number;
  tipoCobro: 'hora' | 'contrato';
  wifiPermitido?: string;
}

export interface Actividad {
  id: string;
  tipo: 'video' | 'foto' | 'asesoria' | 'otro';
  descripcion: string;
}

export interface RegistroJornada {
  id: string;
  clienteId: string;
  fecha: string; // YYYY-MM-DD
  horaEntrada: string;
  fotoEntradaUrl?: string;
  wifiEntradaValido: boolean;
  inicioBreak?: string;
  finBreak?: string;
  horaSalida?: string;
  fotoSalidaUrl?: string;
  wifiSalidaValido?: boolean;
  actividades: Actividad[];
  totalHoras: number;
  completado: boolean;
}

export interface Factura {
  id: string;
  clienteId: string;
  fechaEmision: string;
  registrosIds: string[];
  totalHoras: number;
  montoTotal: number;
  tipoCobro: 'hora' | 'contrato';
}

export interface SolicitudPresupuesto {
  id: string;
  nombreCliente: string;
  correo: string;
  telefono?: string;
  tipoServicio: 'dev-ux-ui' | 'asesoria-marca' | 'marketing-audiovisual' | 'fotografia-eventos';
  descripcionProyecto: string;
  fechaEntrega?: string;
  fechaEvento?: string;
  fechaAsesoria?: string;
  horaEvento?: string;
  duracionProyecto?: string;
  duracionEvento?: string;
  lugarEvento?: string;
  invitados?: string;
  problemaServicio?: string;
  redesSociales?: string;
  metodoPago: string;
  moneda: 'USD' | 'VES';
  estado: 'nuevo' | 'revisado' | 'agendado';
  fechaSolicitud: string;
  reunionFecha?: string;
  reunionHora?: string;
  reunionNotas?: string;
}