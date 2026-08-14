/**
 * catalogo.ts
 *
 * Parser for the World Office "Cuentas Contables" Excel export.
 *
 * Expected columns (row 3 in the standard export):
 *   Codigo | Nombre | SubCta | Inac | Oculto_ | Terceros | Grupo | Tipo | AXI | Contabilizacion
 *
 * The "Tipo" column drives automatic classification of accounts that would
 * otherwise fall outside the PUC default prefix rules.
 *
 * Auto-exception generation logic:
 *   1. Map catalog Tipo → CategoriaEstadoResultados (tipoCatalogoToCategoria)
 *   2. Compare with what the PUC prefix rules give (clasificarCuenta with no exceptions)
 *   3. Where they differ, emit an ExcepcionClasificacion so the account is
 *      processed with the correct category — without any manual setup.
 *
 * Manual exceptions (from EstadoResultadosExcepcion) always take precedence;
 * call catalogoToAutoExcepciones and append its result AFTER the manual list.
 */

import * as XLSX from "xlsx"
import type { CategoriaEstadoResultados, ExcepcionClasificacion } from "./types"
import { clasificarCuenta } from "./clasificacion"

// ─── Catalog entry ────────────────────────────────────────────────────────────

export interface CatalogoCuentaEntry {
  codigo:   string
  nombre:   string
  /** Original "Tipo" value from the catalog: "Ingresos", "Gastos", "Costo De Ventas", … */
  tipo:     string
  grupo:    string
  inactivo: boolean
}

// ─── Tipo → CategoriaEstadoResultados ────────────────────────────────────────

/**
 * Map a catalog Tipo + account code to one of our classification categories.
 * For "Ingresos" and "Gastos" types we still apply the PUC sub-prefix rules
 * (41/42 and 51/52/53) to preserve operacional vs no-operacional distinction.
 */
export function tipoCatalogoToCategoria(
  tipo:   string,
  codigo: string
): CategoriaEstadoResultados {
  switch (tipo) {
    case "Ingresos":
      if (codigo.startsWith("41")) return "ingresos_operacionales"
      if (codigo.startsWith("42")) return "ingresos_no_operacionales"
      return "ingresos_operacionales"   // non-standard code → default to operacional

    case "Gastos":
      if (codigo.startsWith("51")) return "gastos_administrativos"
      if (codigo.startsWith("52")) return "gastos_ventas"
      if (codigo.startsWith("53")) return "gastos_no_operacionales"
      if (codigo.startsWith("54")) return "gastos_no_operacionales"
      if (codigo.startsWith("59")) return "gastos_no_operacionales"
      return "gastos_administrativos"   // non-standard code → default to admin

    // All cost sub-types map to costos_ventas
    case "Costo De Ventas":
    case "Costo Mano de Obra":
    case "Costos Indirectos de Fabricación":
    case "Costo Materia Prima":
    case "Costo Servicios Externos":
      return "costos_ventas"

    // Assets, liabilities, equity, order accounts → not part of P&L
    default:
      return "ignorar"
  }
}

// ─── Excel parser ─────────────────────────────────────────────────────────────

/**
 * Parse a World Office "Cuentas Contables" Excel file (base64-encoded).
 * Returns one entry per numeric account code found.
 */
export function parseCatalogoExcel(archivoBase64: string): CatalogoCuentaEntry[] {
  const buf  = Buffer.from(archivoBase64, "base64")
  const wb   = XLSX.read(buf, { type: "buffer" })
  const ws   = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as any[][]

  // Locate header row (contains "Codigo" or "Código")
  let headerIdx = -1
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const lower = rows[i].map((c: any) => String(c).trim().toLowerCase())
    if (lower.includes("codigo") || lower.includes("código")) {
      headerIdx = i
      break
    }
  }
  if (headerIdx < 0) {
    throw new Error("No se encontró la fila de encabezados (debe contener 'Codigo' y 'Tipo')")
  }

  const header  = rows[headerIdx].map((c: any) => String(c).trim().toLowerCase())
  const codigoI = header.findIndex(h => h === "codigo" || h === "código")
  const nombreI = header.findIndex(h => h === "nombre")
  const tipoI   = header.findIndex(h => h === "tipo")
  const grupoI  = header.findIndex(h => h === "grupo")
  const inacI   = header.findIndex(h => h === "inac")

  if (codigoI < 0) throw new Error("Columna 'Codigo' no encontrada en el archivo")
  if (tipoI   < 0) throw new Error("Columna 'Tipo' no encontrada en el archivo")

  const result: CatalogoCuentaEntry[] = []

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row    = rows[i]
    const codigo = String(row[codigoI] ?? "").trim()
    if (!codigo || !/^\d+$/.test(codigo)) continue   // skip non-numeric codes

    result.push({
      codigo,
      nombre:   nombreI >= 0 ? String(row[nombreI] ?? "").trim() : "",
      tipo:     String(row[tipoI]  ?? "").trim(),
      grupo:    grupoI  >= 0 ? (String(row[grupoI] ?? "Normal").trim() || "Normal") : "Normal",
      inactivo: inacI   >= 0 ? String(row[inacI]  ?? "NO").trim().toUpperCase() === "SI" : false,
    })
  }

  if (result.length === 0) {
    throw new Error("No se encontraron cuentas con código numérico en el archivo")
  }

  return result
}

// ─── Auto-exception generation ────────────────────────────────────────────────

/**
 * For each catalog entry whose Tipo maps to a category different from what
 * the PUC default prefix rules would assign, return an ExcepcionClasificacion
 * that corrects the classification — without any manual configuration.
 *
 * Usage in the archivos POST route:
 *   const autoExc  = catalogoToAutoExcepciones(catalogoDb)
 *   const allExc   = [...manualExcepciones, ...autoExc]   // manual take priority
 *   const resultado = calcularEstadoResultados(libro, allExc)
 */
export function catalogoToAutoExcepciones(
  entries: Pick<CatalogoCuentaEntry, "codigo" | "tipo">[]
): Pick<ExcepcionClasificacion, "prefijoCuenta" | "categoriaDestino">[] {
  const result: Pick<ExcepcionClasificacion, "prefijoCuenta" | "categoriaDestino">[] = []

  for (const entry of entries) {
    const catCategoria = tipoCatalogoToCategoria(entry.tipo, entry.codigo)
    if (catCategoria === "ignorar") continue

    const pucCategoria = clasificarCuenta(entry.codigo, [])   // pure PUC, no exceptions
    if (pucCategoria !== catCategoria) {
      result.push({
        prefijoCuenta:    entry.codigo,
        categoriaDestino: catCategoria,
      })
    }
  }

  return result
}
