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
  | "Anual"
  | "Semestral";

export interface Obligacion {
  id: string;
  empresa: string;
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
  declarado: boolean;
  pagado: boolean;
}

export const EMPRESAS = [
  { nombre: "X TOURS SAS", color: "#3B82F6" },
  { nombre: "DIAZAR LTDA", color: "#8B5CF6" },
  { nombre: "300 HILOS SAS", color: "#EC4899" },
  { nombre: "TEXTILES DEL NORTE", color: "#F59E0B" },
  { nombre: "AGENCIA VIAJES EXPRESS", color: "#10B981" },
  { nombre: "COMERCIALIZADORA ABC", color: "#EF4444" },
];

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

// TODAY = June 3, 2026
// + days = future, - days = past
function daysFromToday(days: number): string {
  const date = new Date(2026, 5, 3); // June 3, 2026
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

export const OBLIGACIONES_MOCK: Obligacion[] = [
  // --- VENCIDAS (past dates) ---
  {
    id: "1",
    empresa: "X TOURS SAS",
    empresaColor: "#3B82F6",
    tipoObligacion: "Retención en la Fuente",
    municipio: "Nacional",
    periodicidad: "Mensual",
    periodo: 4,
    anio: 2026,
    fechaVencimiento: daysFromToday(-5), // May 29
    estado: "VENCIDO",
    responsable: "Andrés Torres",
    observaciones: "Formulario 350 - Abril 2026",
    contabilizado: false,
    declarado: false,
    pagado: false,
  },
  {
    id: "2",
    empresa: "DIAZAR LTDA",
    empresaColor: "#8B5CF6",
    tipoObligacion: "IVA",
    municipio: "Nacional",
    periodicidad: "Bimestral",
    periodo: 2,
    anio: 2026,
    fechaVencimiento: daysFromToday(-3), // May 31
    estado: "VENCIDO",
    responsable: "María López",
    observaciones: "Bimestre Mar-Abr 2026",
    contabilizado: false,
    declarado: false,
    pagado: false,
  },
  {
    id: "3",
    empresa: "300 HILOS SAS",
    empresaColor: "#EC4899",
    tipoObligacion: "Seguridad Social",
    municipio: "Nacional",
    periodicidad: "Mensual",
    periodo: 4,
    anio: 2026,
    fechaVencimiento: daysFromToday(-2), // June 1
    estado: "VENCIDO",
    responsable: "Carlos Ramírez",
    contabilizado: false,
    declarado: false,
    pagado: false,
  },

  // --- MUY URGENTES (0-3 días) ---
  {
    id: "4",
    empresa: "TEXTILES DEL NORTE",
    empresaColor: "#F59E0B",
    tipoObligacion: "Nómina Electrónica",
    municipio: "Nacional",
    periodicidad: "Mensual",
    periodo: 5,
    anio: 2026,
    fechaVencimiento: daysFromToday(1), // June 4
    estado: "EN_PROCESO",
    responsable: "Ana Martínez",
    observaciones: "Transmisión DIAN nómina mayo",
    contabilizado: false,
    declarado: false,
    pagado: false,
  },
  {
    id: "5",
    empresa: "X TOURS SAS",
    empresaColor: "#3B82F6",
    tipoObligacion: "FONTUR",
    municipio: "Nacional",
    periodicidad: "Trimestral",
    periodo: 1,
    anio: 2026,
    fechaVencimiento: daysFromToday(2), // June 5
    estado: "PENDIENTE",
    responsable: "Andrés Torres",
    observaciones: "Aporte FONTUR 1er trimestre 2026",
    contabilizado: false,
    declarado: false,
    pagado: false,
  },
  {
    id: "6",
    empresa: "AGENCIA VIAJES EXPRESS",
    empresaColor: "#10B981",
    tipoObligacion: "FONTUR",
    municipio: "Nacional",
    periodicidad: "Trimestral",
    periodo: 1,
    anio: 2026,
    fechaVencimiento: daysFromToday(2), // June 5
    estado: "PENDIENTE",
    responsable: "Pedro Gómez",
    observaciones: "Aporte FONTUR 1er trimestre 2026",
    contabilizado: false,
    declarado: false,
    pagado: false,
  },

  // --- URGENTES (3-7 días) ---
  {
    id: "7",
    empresa: "COMERCIALIZADORA ABC",
    empresaColor: "#EF4444",
    tipoObligacion: "Retención en la Fuente",
    municipio: "Nacional",
    periodicidad: "Mensual",
    periodo: 5,
    anio: 2026,
    fechaVencimiento: daysFromToday(5), // June 8
    estado: "PENDIENTE",
    responsable: "Luisa Herrera",
    observaciones: "Formulario 350 - Mayo 2026",
    contabilizado: false,
    declarado: false,
    pagado: false,
  },
  {
    id: "8",
    empresa: "DIAZAR LTDA",
    empresaColor: "#8B5CF6",
    tipoObligacion: "ReteICA",
    municipio: "Bogotá",
    periodicidad: "Bimestral",
    periodo: 2,
    anio: 2026,
    fechaVencimiento: daysFromToday(5), // June 8
    estado: "EN_PROCESO",
    responsable: "María López",
    observaciones: "ReteICA Bogotá bimestre Mar-Abr",
    contabilizado: false,
    declarado: false,
    pagado: false,
  },
  {
    id: "9",
    empresa: "300 HILOS SAS",
    empresaColor: "#EC4899",
    tipoObligacion: "ICA",
    municipio: "Bogotá",
    periodicidad: "Bimestral",
    periodo: 2,
    anio: 2026,
    fechaVencimiento: daysFromToday(6), // June 9
    estado: "PENDIENTE",
    responsable: "Carlos Ramírez",
    observaciones: "ICA Bogotá bimestre Mar-Abr 2026",
    contabilizado: false,
    declarado: false,
    pagado: false,
  },
  {
    id: "10",
    empresa: "TEXTILES DEL NORTE",
    empresaColor: "#F59E0B",
    tipoObligacion: "ICA",
    municipio: "Medellín",
    periodicidad: "Bimestral",
    periodo: 2,
    anio: 2026,
    fechaVencimiento: daysFromToday(7), // June 10
    estado: "PENDIENTE",
    responsable: "Ana Martínez",
    contabilizado: false,
    declarado: false,
    pagado: false,
  },

  // --- PRÓXIMAS (7-15 días) ---
  {
    id: "11",
    empresa: "X TOURS SAS",
    empresaColor: "#3B82F6",
    tipoObligacion: "Retención en la Fuente",
    municipio: "Nacional",
    periodicidad: "Mensual",
    periodo: 5,
    anio: 2026,
    fechaVencimiento: daysFromToday(8), // June 11
    estado: "PENDIENTE",
    responsable: "Andrés Torres",
    observaciones: "Formulario 350 - Mayo 2026",
    contabilizado: false,
    declarado: false,
    pagado: false,
  },
  {
    id: "12",
    empresa: "AGENCIA VIAJES EXPRESS",
    empresaColor: "#10B981",
    tipoObligacion: "Retención en la Fuente",
    municipio: "Nacional",
    periodicidad: "Mensual",
    periodo: 5,
    anio: 2026,
    fechaVencimiento: daysFromToday(8), // June 11
    estado: "PENDIENTE",
    responsable: "Pedro Gómez",
    contabilizado: false,
    declarado: false,
    pagado: false,
  },
  {
    id: "13",
    empresa: "DIAZAR LTDA",
    empresaColor: "#8B5CF6",
    tipoObligacion: "Seguridad Social",
    municipio: "Nacional",
    periodicidad: "Mensual",
    periodo: 5,
    anio: 2026,
    fechaVencimiento: daysFromToday(12), // June 15
    estado: "PENDIENTE",
    responsable: "María López",
    observaciones: "PILA mayo 2026",
    contabilizado: false,
    declarado: false,
    pagado: false,
  },
  {
    id: "14",
    empresa: "COMERCIALIZADORA ABC",
    empresaColor: "#EF4444",
    tipoObligacion: "Nómina Electrónica",
    municipio: "Nacional",
    periodicidad: "Mensual",
    periodo: 5,
    anio: 2026,
    fechaVencimiento: daysFromToday(12), // June 15
    estado: "PENDIENTE",
    responsable: "Luisa Herrera",
    contabilizado: false,
    declarado: false,
    pagado: false,
  },
  {
    id: "15",
    empresa: "300 HILOS SAS",
    empresaColor: "#EC4899",
    tipoObligacion: "Anticipo Bimestral SIMPLE",
    municipio: "Nacional",
    periodicidad: "Bimestral",
    periodo: 3,
    anio: 2026,
    fechaVencimiento: daysFromToday(15), // June 18
    estado: "PENDIENTE",
    responsable: "Carlos Ramírez",
    observaciones: "Régimen SIMPLE - anticipo mayo-jun",
    contabilizado: false,
    declarado: false,
    pagado: false,
  },

  // --- PRÓXIMAS MÁS DE 15 DÍAS ---
  {
    id: "16",
    empresa: "X TOURS SAS",
    empresaColor: "#3B82F6",
    tipoObligacion: "Seguridad Social",
    municipio: "Nacional",
    periodicidad: "Mensual",
    periodo: 5,
    anio: 2026,
    fechaVencimiento: daysFromToday(22), // June 25
    estado: "PENDIENTE",
    responsable: "Andrés Torres",
    contabilizado: false,
    declarado: false,
    pagado: false,
  },
  {
    id: "17",
    empresa: "TEXTILES DEL NORTE",
    empresaColor: "#F59E0B",
    tipoObligacion: "IVA",
    municipio: "Nacional",
    periodicidad: "Bimestral",
    periodo: 3,
    anio: 2026,
    fechaVencimiento: daysFromToday(27), // June 30
    estado: "PENDIENTE",
    responsable: "Ana Martínez",
    observaciones: "Bimestre May-Jun 2026",
    contabilizado: false,
    declarado: false,
    pagado: false,
  },
  {
    id: "18",
    empresa: "COMERCIALIZADORA ABC",
    empresaColor: "#EF4444",
    tipoObligacion: "ICA",
    municipio: "Cali",
    periodicidad: "Bimestral",
    periodo: 3,
    anio: 2026,
    fechaVencimiento: daysFromToday(30), // July 3
    estado: "PENDIENTE",
    responsable: "Luisa Herrera",
    contabilizado: false,
    declarado: false,
    pagado: false,
  },
  {
    id: "19",
    empresa: "AGENCIA VIAJES EXPRESS",
    empresaColor: "#10B981",
    tipoObligacion: "IVA",
    municipio: "Nacional",
    periodicidad: "Bimestral",
    periodo: 3,
    anio: 2026,
    fechaVencimiento: daysFromToday(35), // July 8
    estado: "PENDIENTE",
    responsable: "Pedro Gómez",
    observaciones: "Bimestre May-Jun 2026",
    contabilizado: false,
    declarado: false,
    pagado: false,
  },
  {
    id: "20",
    empresa: "DIAZAR LTDA",
    empresaColor: "#8B5CF6",
    tipoObligacion: "Anticipo Bimestral SIMPLE",
    municipio: "Nacional",
    periodicidad: "Bimestral",
    periodo: 4,
    anio: 2026,
    fechaVencimiento: daysFromToday(42), // July 15
    estado: "PENDIENTE",
    responsable: "María López",
    contabilizado: false,
    declarado: false,
    pagado: false,
  },
  {
    id: "21",
    empresa: "300 HILOS SAS",
    empresaColor: "#EC4899",
    tipoObligacion: "Renovación Cámara de Comercio",
    municipio: "Bogotá",
    periodicidad: "Anual",
    periodo: 1,
    anio: 2026,
    fechaVencimiento: daysFromToday(55), // July 28
    estado: "PENDIENTE",
    responsable: "Carlos Ramírez",
    observaciones: "Matrícula mercantil 2026",
    contabilizado: false,
    declarado: false,
    pagado: false,
  },

  // --- COMPLETADAS ---
  {
    id: "22",
    empresa: "X TOURS SAS",
    empresaColor: "#3B82F6",
    tipoObligacion: "IVA",
    municipio: "Nacional",
    periodicidad: "Bimestral",
    periodo: 1,
    anio: 2026,
    fechaVencimiento: daysFromToday(-30), // May 4
    estado: "PAGADO",
    responsable: "Andrés Torres",
    observaciones: "Bimestre Ene-Feb 2026 - PAGO CONFIRMADO",
    contabilizado: false,
    declarado: false,
    pagado: false,
  },
  {
    id: "23",
    empresa: "DIAZAR LTDA",
    empresaColor: "#8B5CF6",
    tipoObligacion: "Retención en la Fuente",
    municipio: "Nacional",
    periodicidad: "Mensual",
    periodo: 3,
    anio: 2026,
    fechaVencimiento: daysFromToday(-28), // May 6
    estado: "PAGADO",
    responsable: "María López",
    observaciones: "Formulario 350 - Marzo 2026",
    contabilizado: false,
    declarado: false,
    pagado: false,
  },
  {
    id: "24",
    empresa: "AGENCIA VIAJES EXPRESS",
    empresaColor: "#10B981",
    tipoObligacion: "Seguridad Social",
    municipio: "Nacional",
    periodicidad: "Mensual",
    periodo: 3,
    anio: 2026,
    fechaVencimiento: daysFromToday(-25), // May 9
    estado: "PRESENTADO",
    responsable: "Pedro Gómez",
    observaciones: "PILA abril 2026 - presentado UGPP",
    contabilizado: false,
    declarado: false,
    pagado: false,
  },
  {
    id: "25",
    empresa: "TEXTILES DEL NORTE",
    empresaColor: "#F59E0B",
    tipoObligacion: "Nómina Electrónica",
    municipio: "Nacional",
    periodicidad: "Mensual",
    periodo: 4,
    anio: 2026,
    fechaVencimiento: daysFromToday(-20), // May 14
    estado: "PAGADO",
    responsable: "Ana Martínez",
    observaciones: "Transmisión DIAN abril - OK",
    contabilizado: false,
    declarado: false,
    pagado: false,
  },
  {
    id: "26",
    empresa: "COMERCIALIZADORA ABC",
    empresaColor: "#EF4444",
    tipoObligacion: "ICA",
    municipio: "Bogotá",
    periodicidad: "Bimestral",
    periodo: 1,
    anio: 2026,
    fechaVencimiento: daysFromToday(-15), // May 19
    estado: "PRESENTADO",
    responsable: "Luisa Herrera",
    observaciones: "ICA Bogotá bimestre Ene-Feb 2026",
    contabilizado: false,
    declarado: false,
    pagado: false,
  },
  {
    id: "27",
    empresa: "300 HILOS SAS",
    empresaColor: "#EC4899",
    tipoObligacion: "Declaración de Renta",
    municipio: "Nacional",
    periodicidad: "Anual",
    periodo: 1,
    anio: 2025,
    fechaVencimiento: daysFromToday(-10), // May 24
    estado: "PRESENTADO",
    responsable: "Carlos Ramírez",
    observaciones: "Renta 2025 - Presentada DIAN",
    contabilizado: false,
    declarado: false,
    pagado: false,
  },
  // Agosto
  {
    id: "28",
    empresa: "X TOURS SAS",
    empresaColor: "#3B82F6",
    tipoObligacion: "Información Exógena",
    municipio: "Nacional",
    periodicidad: "Anual",
    periodo: 1,
    anio: 2025,
    fechaVencimiento: daysFromToday(68), // Aug 10
    estado: "PENDIENTE",
    responsable: "Andrés Torres",
    observaciones: "Medios magnéticos DIAN 2025",
    contabilizado: false,
    declarado: false,
    pagado: false,
  },
  {
    id: "29",
    empresa: "DIAZAR LTDA",
    empresaColor: "#8B5CF6",
    tipoObligacion: "Declaración de Renta",
    municipio: "Nacional",
    periodicidad: "Anual",
    periodo: 1,
    anio: 2025,
    fechaVencimiento: daysFromToday(72), // Aug 14
    estado: "EN_PROCESO",
    responsable: "María López",
    observaciones: "Renta persona jurídica 2025",
    contabilizado: false,
    declarado: false,
    pagado: false,
  },
];
