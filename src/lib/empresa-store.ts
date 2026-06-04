import type { EmpresaMock } from "./empresas-mock";
import { readStore } from "./persist";

export const empresaStore: { list: EmpresaMock[] } = {
  list: readStore("empresas", [] as EmpresaMock[]),
};
