// Reference date: June 3, 2026 (today)
// All dates relative to this reference

export type EstadoObligacion =
  | "PENDIENTE"
  | "EN_PROCESO"
  | "PRESENTADO"
  | "PAGADO"
  | "VENCIDO";

export type PeriodicidadObligacion =
  | "Mensual"
  | "Bimestral"
  | "Trimestral"
  | "Cuatrimestral"
  | "Semestral"
  | "Anual";

export interface Obligacion {
  id: string;
  empresa: string;
  empresaId?: string;
  empresaColor: string;
  tipoObligacion: string;
  municipio: string;
  periodicidad: PeriodicidadObligacion;
  periodo: number;
  anio: number;
  fechaVencimiento: string; // ISO date string
  estado: EstadoObligacion;
  responsable: string;
  observaciones?: string;
  contabilizado: boolean;
  contabilizadoArchivoNombre?: string | null;
  contabilizadoFecha?: string | null;
  contabilizadoPorNombre?: string | null;
  declarado: boolean;
  declaradoArchivoNombre?: string | null;
  declaradoFecha?: string | null;
  declaradoPorNombre?: string | null;
  pagado: boolean;
}

export const ESTADOS_LABELS: Record<EstadoObligacion, string> = {
  PENDIENTE: "Pendiente",
  EN_PROCESO: "En Proceso",
  PRESENTADO: "Presentado",
  PAGADO: "Pagado",
  VENCIDO: "Vencido",
};

export const TIPOS_OBLIGACION = [
  "IVA",
  "Retención en la Fuente",
  "ICA",
  "ReteICA",
  "Declaración de Renta",
  "Impuesto anual consolidado RST",
  "Información Exógena",
  "Nómina Electrónica",
  "Seguridad Social",
  "Parafiscales",
  "Resolución de Facturación",
  "Renovación Cámara de Comercio",
  "Medios Magnéticos",
  "Supersociedades",
  "FONTUR",
  "Anticipo Bimestral SIMPLE",
  "UGPP",
  "Personalizada",
];


