import type { EmpresaMock } from "./empresas-mock";

// Module-level store — shared across all requests in the same server process.
// Populated when the admin visits the Empresas page; resets on server restart.
export const empresaStore: { list: EmpresaMock[] } = {
  list: [],
};
