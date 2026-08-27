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