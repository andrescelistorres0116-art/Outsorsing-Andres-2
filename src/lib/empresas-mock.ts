// Shared empresa mock data — imported by both empresas page and accesos modal

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

export const EMPRESAS_MOCK: EmpresaMock[] = [
  {
    id: "1",
    razonSocial: "X TOURS SAS",
    nit: "901234567-8",
    ciudad: "Bogotá",
    departamento: "Cundinamarca",
    regimen: "Régimen Ordinario",
    estado: "ACTIVA",
    representante: "Carlos Ramírez",
    telefono: "601 320 4500",
    correo: "contabilidad@xtours.co",
    fechaInicioRelacion: "2020-01-15",
    tipoNomina: "electronica_dian",
    periodicidadNomina: "quincenal",
  },
  {
    id: "2",
    razonSocial: "DIAZAR LTDA",
    nit: "800123456-1",
    ciudad: "Bogotá",
    departamento: "Cundinamarca",
    regimen: "SIMPLE",
    estado: "ACTIVA",
    representante: "Diana Zaraza",
    telefono: "601 298 7600",
    correo: "diana@diazar.com",
    fechaInicioRelacion: "2019-06-01",
    tipoNomina: "manual",
    periodicidadNomina: "quincenal",
  },
  {
    id: "3",
    razonSocial: "300 HILOS SAS",
    nit: "890765432-5",
    ciudad: "Medellín",
    departamento: "Antioquia",
    regimen: "Régimen Ordinario",
    estado: "ACTIVA",
    representante: "Jorge Hilo",
    telefono: "604 444 3200",
    correo: "info@300hilos.com",
    fechaInicioRelacion: "2021-03-10",
    tipoNomina: "electronica_dian",
    periodicidadNomina: "quincenal",
  },
  {
    id: "4",
    razonSocial: "TEXTILES DEL NORTE SAS",
    nit: "900876543-2",
    ciudad: "Barranquilla",
    departamento: "Atlántico",
    regimen: "Régimen Ordinario",
    estado: "ACTIVA",
    representante: "Ana Herrera",
    telefono: "605 360 1122",
    correo: "administracion@textilesnorte.co",
    fechaInicioRelacion: "2020-08-20",
    tipoNomina: "electronica_dian",
    periodicidadNomina: "quincenal",
  },
  {
    id: "5",
    razonSocial: "INVERSIONES CASTILLO SAS",
    nit: "800345678-9",
    ciudad: "Bogotá",
    departamento: "Cundinamarca",
    regimen: "Gran Contribuyente",
    estado: "ACTIVA",
    representante: "Roberto Castillo",
    telefono: "601 625 8800",
    correo: "rcastillo@inversionescastillo.com",
    fechaInicioRelacion: "2018-11-05",
    tipoNomina: "electronica_dian",
    periodicidadNomina: "mensual",
  },
  {
    id: "6",
    razonSocial: "COMERCIAL TORRES LTDA",
    nit: "830567890-4",
    ciudad: "Cali",
    departamento: "Valle del Cauca",
    regimen: "Régimen Ordinario",
    estado: "ACTIVA",
    representante: "María Torres",
    telefono: "602 884 5600",
    correo: "mtorres@comercialtorres.co",
    fechaInicioRelacion: "2022-02-14",
    tipoNomina: "electronica_dian",
    periodicidadNomina: "quincenal",
  },
  {
    id: "7",
    razonSocial: "LOGÍSTICA ANDINA SAS",
    nit: "901567890-6",
    ciudad: "Bucaramanga",
    departamento: "Santander",
    regimen: "Régimen Ordinario",
    estado: "ACTIVA",
    representante: "Luis Andrade",
    telefono: "607 697 4400",
    correo: "logistica@andinasas.co",
    fechaInicioRelacion: "2021-09-01",
    tipoNomina: "electronica_dian",
    periodicidadNomina: "quincenal",
  },
  {
    id: "8",
    razonSocial: "CONSTRUCTORA CIMA SAS",
    nit: "900234567-3",
    ciudad: "Medellín",
    departamento: "Antioquia",
    regimen: "Régimen Ordinario",
    estado: "ACTIVA",
    representante: "Felipe Cima",
    telefono: "604 311 9900",
    correo: "fcima@constructoracima.com",
    fechaInicioRelacion: "2023-04-15",
    tipoNomina: "electronica_dian",
    periodicidadNomina: "quincenal",
  },
  {
    id: "9",
    razonSocial: "INMOBILIARIA DEL PACÍFICO SAS",
    nit: "901876543-2",
    ciudad: "Cali",
    departamento: "Valle del Cauca",
    regimen: "SIMPLE",
    estado: "ACTIVA",
    representante: "Sandra Prado",
    telefono: "602 552 7700",
    correo: "sprado@inmopacifico.com",
    fechaInicioRelacion: "2022-07-22",
    tipoNomina: "manual",
    periodicidadNomina: "mensual",
  },
  {
    id: "10",
    razonSocial: "CONSULTORES DIGITALES LTDA",
    nit: "900456789-0",
    ciudad: "Bogotá",
    departamento: "Cundinamarca",
    regimen: "Régimen Ordinario",
    estado: "ACTIVA",
    representante: "Andrés Morales",
    telefono: "601 789 3300",
    correo: "amorales@consdig.co",
    fechaInicioRelacion: "2020-05-10",
    tipoNomina: "electronica_dian",
    periodicidadNomina: "mensual",
  },
  {
    id: "11",
    razonSocial: "SERVILOGÍSTICA EXPRESS SAS",
    nit: "890234567-1",
    ciudad: "Barranquilla",
    departamento: "Atlántico",
    regimen: "Régimen Ordinario",
    estado: "INACTIVA",
    representante: "Patricia Vega",
    telefono: "605 419 6600",
    correo: "pvega@servilogistica.co",
    fechaInicioRelacion: "2019-03-15",
    fechaFinRelacion: "2024-12-31",
    tipoNomina: "no_aplica",
    periodicidadNomina: "no_aplica",
  },
  {
    id: "12",
    razonSocial: "AGROPECUARIA SAN PABLO SAS",
    nit: "800678901-7",
    ciudad: "Villavicencio",
    departamento: "Meta",
    regimen: "Régimen Simple",
    estado: "INACTIVA",
    representante: "Jaime Salcedo",
    telefono: "608 662 1800",
    correo: "jsalcedo@agrosanpablo.co",
    fechaInicioRelacion: "2020-10-01",
    fechaFinRelacion: "2025-06-30",
    tipoNomina: "no_aplica",
    periodicidadNomina: "no_aplica",
  },
];
