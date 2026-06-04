import { readStore } from "./persist";

export interface AccesoStored {
  id: number;
  empresa: string;
  tipo: string;
  plataforma: string;
  usuario: string;
  contrasena: string;
  correoAsociado?: string;
  tags: string[];
  ultimoAcceso: string;
}

const DEFAULT_ACCESOS: AccesoStored[] = [
  {
    id: 1,
    empresa: "X TOURS SAS",
    tipo: "DIAN",
    plataforma: "DIAN - Muisca",
    usuario: "xtours901234@gmail.com",
    contrasena: "Xtours#2024*",
    correoAsociado: "xtours901234@gmail.com",
    tags: ["principal", "declaraciones"],
    ultimoAcceso: "2026-05-28",
  },
  {
    id: 2,
    empresa: "DIAZAR LTDA",
    tipo: "DIAN",
    plataforma: "DIAN - Muisca",
    usuario: "diazar800@hotmail.com",
    contrasena: "Diazar@800!",
    correoAsociado: "diazar800@hotmail.com",
    tags: ["declaraciones", "retención"],
    ultimoAcceso: "2026-05-30",
  },
  {
    id: 3,
    empresa: "300 HILOS SAS",
    tipo: "DIAN",
    plataforma: "DIAN - Muisca",
    usuario: "contabilidad@300hilos.com",
    contrasena: "H1los#Conta24",
    correoAsociado: "contabilidad@300hilos.com",
    tags: ["IVA", "renta"],
    ultimoAcceso: "2026-06-01",
  },
  {
    id: 4,
    empresa: "DIAZAR LTDA",
    tipo: "HACIENDA_BOGOTA",
    plataforma: "Secretaría Hacienda Bogotá",
    usuario: "DIAZAR123",
    contrasena: "Hac!enda2024",
    tags: ["impuesto-industria", "bogotá"],
    ultimoAcceso: "2026-05-15",
  },
  {
    id: 5,
    empresa: "X TOURS SAS",
    tipo: "PARAFISCAL",
    plataforma: "MiPlanilla",
    usuario: "xtours_planilla",
    contrasena: "Plan!lla#X24",
    correoAsociado: "nomina@xtours.co",
    tags: ["parafiscales", "aportes"],
    ultimoAcceso: "2026-06-01",
  },
  {
    id: 6,
    empresa: "300 HILOS SAS",
    tipo: "PARAFISCAL",
    plataforma: "Aportes en Línea",
    usuario: "300hilos_apl",
    contrasena: "APL300H!los",
    correoAsociado: "rrhh@300hilos.com",
    tags: ["parafiscales"],
    ultimoAcceso: "2026-05-31",
  },
  {
    id: 9,
    empresa: "300 HILOS SAS",
    tipo: "CAMARA",
    plataforma: "Cámara de Comercio Bogotá",
    usuario: "ccb.300hilos@gmail.com",
    contrasena: "CCB300H!24",
    correoAsociado: "ccb.300hilos@gmail.com",
    tags: ["registro-mercantil"],
    ultimoAcceso: "2026-04-10",
  },
  {
    id: 10,
    empresa: "X TOURS SAS",
    tipo: "SOFTWARE_CONTABLE",
    plataforma: "Siigo",
    usuario: "xtours.siigo",
    contrasena: "S!igo#Xtours24",
    correoAsociado: "contabilidad@xtours.co",
    tags: ["contabilidad", "software"],
    ultimoAcceso: "2026-06-03",
  },
  {
    id: 11,
    empresa: "300 HILOS SAS",
    tipo: "SOFTWARE_CONTABLE",
    plataforma: "Siigo",
    usuario: "hilos.siigo",
    contrasena: "S!igo#300H24",
    correoAsociado: "info@300hilos.com",
    tags: ["contabilidad", "software"],
    ultimoAcceso: "2026-06-03",
  },
];

export const accesoStore: { list: AccesoStored[] } = {
  list: readStore("accesos", DEFAULT_ACCESOS.map((a) => ({ ...a }))),
};
