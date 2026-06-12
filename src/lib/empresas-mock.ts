// EmpresaMock type — shared between pages and API routes

export interface EmpresaMock {
  id: string;
  razonSocial: string;
  nit: string;
  ciudad: string;
  departamento: string;
  regimen: string;
  estado: "ACTIVA" | "INACTIVA";
  representante: string;
  telefono: string;
  correo: string;
  fechaInicioRelacion: string;
  fechaFinRelacion?: string;
  nombreComercial?: string;
  direccion?: string;
  repCedula?: string;
  repCorreo?: string;
  repTelefono?: string;
  responsabilidadIVA?: string;
  obligadoFacturar?: boolean;
  actividadEconomica?: string;
  tipoContribuyente?: string;
  agenteRetenedor?: boolean;
  tipoNomina?: string;
  periodicidadNomina?: string;
  softwareContable?: string;
}
