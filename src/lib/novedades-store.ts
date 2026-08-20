import { readStore, writeStore } from "@/lib/persist";

export interface NovedadIngreso {
  id: string;
  tipo: "ingreso";
  empresaId: string;
  empresa: string;
  mes: number;
  anio: number;
  // Datos del empleado
  nombre: string;
  cedula: string;
  cargo: string;
  salario: string;
  tipoContrato: string;
  fechaIngreso: string;
  observaciones: string;
  // Metadata
  reportadoPor: string;
  reportadoPorEmail: string;
  fechaReporte: string;
  estado: "pendiente" | "procesado";
}

interface NovedadesStore {
  list: NovedadIngreso[];
}

const store: NovedadesStore = {
  list: readStore<NovedadIngreso[]>("novedades", []),
};

export const novedadesStore = {
  get list() { return store.list; },
  set list(v: NovedadIngreso[]) {
    store.list = v;
    writeStore("novedades", v);
  },
};
