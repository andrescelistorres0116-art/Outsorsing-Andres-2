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

export const accesoStore: { list: AccesoStored[] } = {
  list: readStore("accesos", []),
};
