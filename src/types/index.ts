// ─────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────

export enum UserRole {
  ADMIN = 'ADMIN',
  ANALYST = 'ANALYST',
  NOMINA = 'NOMINA',
  CLIENT = 'CLIENT',
}

export enum EstadoEmpresa {
  ACTIVA = 'ACTIVA',
  INACTIVA = 'INACTIVA',
}

export enum TipoAcceso {
  DIAN = 'DIAN',
  HACIENDA = 'HACIENDA',
  PARAFISCAL = 'PARAFISCAL',
  BANCO = 'BANCO',
  CAMARA = 'CAMARA',
  UGPP = 'UGPP',
  SUPERSOCIEDADES = 'SUPERSOCIEDADES',
  SOFTWARE_CONTABLE = 'SOFTWARE_CONTABLE',
  FACTURACION = 'FACTURACION',
  FIRMA_DIGITAL = 'FIRMA_DIGITAL',
  OTRO = 'OTRO',
}

export enum EstadoObligacion {
  PENDIENTE = 'PENDIENTE',
  EN_PROCESO = 'EN_PROCESO',
  PRESENTADO = 'PRESENTADO',
  PAGADO = 'PAGADO',
  VENCIDO = 'VENCIDO',
}

export enum TipoObligacion {
  // Declaraciones nacionales DIAN
  RETENCION_FUENTE = 'RETENCION_FUENTE',
  IVA = 'IVA',
  RENTA_PERSONAS_JURIDICAS = 'RENTA_PERSONAS_JURIDICAS',
  RENTA_PERSONAS_NATURALES = 'RENTA_PERSONAS_NATURALES',
  RENTA_CREE = 'RENTA_CREE',
  ICA = 'ICA',
  ICA_BIMESTRAL = 'ICA_BIMESTRAL',
  PATRIMONIO = 'PATRIMONIO',
  NORMALIZACION_TRIBUTARIA = 'NORMALIZACION_TRIBUTARIA',
  IMPUESTO_INDUSTRIA_COMERCIO = 'IMPUESTO_INDUSTRIA_COMERCIO',
  IMPUESTO_PREDIAL = 'IMPUESTO_PREDIAL',
  IMPUESTO_VEHICULOS = 'IMPUESTO_VEHICULOS',
  // Parafiscales y seguridad social
  PILA = 'PILA',
  PARAFISCALES = 'PARAFISCALES',
  // Reportes de información
  EXOGENA_DIAN = 'EXOGENA_DIAN',
  MEDIOS_MAGNETICOS_MUNICIPIO = 'MEDIOS_MAGNETICOS_MUNICIPIO',
  INFORMACION_CAMARA = 'INFORMACION_CAMARA',
  // Facturación electrónica
  FACTURACION_ELECTRONICA = 'FACTURACION_ELECTRONICA',
  RENOVACION_MATRICULA = 'RENOVACION_MATRICULA',
  // Supersociedades / otros entes de control
  SUPERSOCIEDADES_INFORME = 'SUPERSOCIEDADES_INFORME',
  UGPP_INFORME = 'UGPP_INFORME',
  DECLARACION_CONSULAR = 'DECLARACION_CONSULAR',
  OTRA = 'OTRA',
}

export enum Periodicidad {
  MENSUAL = 'MENSUAL',
  BIMESTRAL = 'BIMESTRAL',
  TRIMESTRAL = 'TRIMESTRAL',
  CUATRIMESTRAL = 'CUATRIMESTRAL',
  SEMESTRAL = 'SEMESTRAL',
  ANUAL = 'ANUAL',
  UNICA = 'UNICA',
}

export enum PeriodoNomina {
  PRIMERA_QUINCENA = 'PRIMERA_QUINCENA',
  SEGUNDA_QUINCENA = 'SEGUNDA_QUINCENA',
}

export enum TipoNovedad {
  HORAS_EXTRAS = 'HORAS_EXTRAS',
  RECARGOS = 'RECARGOS',
  BONIFICACIONES = 'BONIFICACIONES',
  COMISIONES = 'COMISIONES',
  INCAPACIDAD = 'INCAPACIDAD',
  LICENCIA = 'LICENCIA',
  VACACIONES = 'VACACIONES',
  LIBRANZA = 'LIBRANZA',
  EMBARGO = 'EMBARGO',
  INGRESO = 'INGRESO',
  RETIRO = 'RETIRO',
  LLEGADA_TARDE = 'LLEGADA_TARDE',
  AUSENCIA = 'AUSENCIA',
  OTRA = 'OTRA',
}

export enum EstadoReporteNomina {
  BORRADOR = 'BORRADOR',
  ENVIADO = 'ENVIADO',
  REVISADO = 'REVISADO',
  APROBADO = 'APROBADO',
}

// ─────────────────────────────────────────────
// Frontend interfaces (plain TS, no Prisma dependency)
// ─────────────────────────────────────────────

export interface IUser {
  id: string
  email: string
  name: string
  role: UserRole
  companyId: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface IEmpresa {
  id: string
  razonSocial: string
  nombreComercial: string | null
  nit: string
  dv: string
  direccion: string | null
  ciudad: string | null
  departamento: string | null
  telefono: string | null
  correo: string | null
  estado: EstadoEmpresa

  // Representante legal
  repLegalNombre: string | null
  repLegalCedula: string | null
  repLegalCorreo: string | null
  repLegalTelefono: string | null

  // Información tributaria
  regimen: string | null
  responsabilidadIva: string | null
  obligadoFacturar: boolean
  resolucionFacturacion: string | null
  fechaVencimientoResolucion: Date | null
  actividadEconomica: string | null
  tipoContribuyente: string | null
  agenteRetenedor: boolean

  // Software y nómina
  softwareContable: string | null
  tipoNomina: string | null
  periodicidadNomina: string | null
  tipoFacturacionElectronica: string | null

  createdAt: Date
  updatedAt: Date
}

export interface IAcceso {
  id: string
  empresaId: string
  tipo: TipoAcceso
  plataforma: string | null
  usuario: string | null
  contrasena: string | null
  correoAsociado: string | null
  preguntasSeguridad: string | null
  tokenCodigo: string | null
  banco: string | null
  observaciones: string | null
  municipio: string | null
  tags: string[]
  createdBy: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ILogAcceso {
  id: string
  accesoId: string
  userId: string
  accion: string
  timestamp: Date
}

export interface IObligacionTributaria {
  id: string
  empresaId: string
  tipoObligacion: string
  periodicidad: Periodicidad
  periodo: string | null
  año: number
  fechaVencimiento: Date
  estado: EstadoObligacion
  responsableId: string | null
  observaciones: string | null
  municipio: string | null
  createdAt: Date
  updatedAt: Date
}

export interface IEmpleado {
  id: string
  empresaId: string
  cedula: string
  nombre: string
  ciudad: string | null
  activo: boolean
  createdAt: Date
}

export interface INovedadNomina {
  id: string
  empleadoId: string
  empresaId: string
  periodo: PeriodoNomina
  mes: number
  año: number
  tipoNovedad: TipoNovedad
  valor: number | null
  horas: number | null
  descripcion: string | null
  adjunto: string | null
  createdAt: Date
  updatedAt: Date
}

export interface IReporteNomina {
  id: string
  empresaId: string
  periodo: PeriodoNomina
  mes: number
  año: number
  estado: EstadoReporteNomina
  sinNovedades: boolean
  comentarios: string | null
  enviadoPor: string | null
  createdAt: Date
  updatedAt: Date
}

// ─────────────────────────────────────────────
// Utility / derived types
// ─────────────────────────────────────────────

/** Empresa with shallow relations for list views */
export interface IEmpresaConRelaciones extends IEmpresa {
  usuarios?: IUser[]
  accesos?: IAcceso[]
  obligaciones?: IObligacionTributaria[]
  empleados?: IEmpleado[]
}

/** Obligacion with expanded responsable and empresa names */
export interface IObligacionConRelaciones extends IObligacionTributaria {
  empresa?: Pick<IEmpresa, 'id' | 'razonSocial' | 'nit'>
  responsable?: Pick<IUser, 'id' | 'name' | 'email'>
}

/** Dashboard summary card */
export interface IResumenObligaciones {
  total: number
  pendientes: number
  enProceso: number
  presentadas: number
  pagadas: number
  vencidas: number
  proximasAVencer: number // within 7 days
}
