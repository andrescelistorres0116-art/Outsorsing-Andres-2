/**
 * merger.ts
 *
 * Merges multiple EstadoResultados (one per uploaded file / period) into a
 * single combined view with all months as columns.
 *
 * Strategy:
 *   - Months are unioned and sorted chronologically.
 *   - Lines from the same section are matched by `concepto` (account name).
 *     When the same account appears in multiple files, its porMes entries are
 *     merged (different months go into the same porMes map).
 *   - acumulado for each merged line is re-derived as the sum of its porMes
 *     values so that saldo-inicial contributions from each file are NOT
 *     double-counted (each file carries its own opening balance).
 *   - All subtotals are recomputed from the merged lines.
 */

import type {
  EstadoResultados,
  LineaEstadoResultados,
  SubtotalEstadoResultados,
  CategoriaEstadoResultados,
  ExcepcionClasificacion,
} from "./types"

// ─── Section ↔ Category mapping ──────────────────────────────────────────────

type SectionKey =
  | "ingresos_operacionales"
  | "costos_ventas"
  | "gastos_administrativos"
  | "gastos_ventas"
  | "ingresos_no_operacionales"
  | "gastos_no_operacionales"
  | "impuesto_renta"

const SECTION_KEYS: SectionKey[] = [
  "ingresos_operacionales",
  "costos_ventas",
  "gastos_administrativos",
  "gastos_ventas",
  "ingresos_no_operacionales",
  "gastos_no_operacionales",
  "impuesto_renta",
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sumLines(
  lines: LineaEstadoResultados[],
  meses: string[]
): SubtotalEstadoResultados {
  const porMes: Record<string, number> = {}
  meses.forEach(m => (porMes[m] = 0))
  let acumulado = 0
  for (const l of lines) {
    acumulado += l.acumulado
    for (const m of meses) porMes[m] = (porMes[m] ?? 0) + (l.porMes[m] ?? 0)
  }
  return { concepto: "", acumulado, porMes }
}

function subtract(
  a: SubtotalEstadoResultados,
  ...bs: SubtotalEstadoResultados[]
): SubtotalEstadoResultados {
  const porMes = { ...a.porMes }
  let acumulado = a.acumulado
  for (const b of bs) {
    acumulado -= b.acumulado
    for (const m of Object.keys(porMes)) {
      porMes[m] = (porMes[m] ?? 0) - (b.porMes[m] ?? 0)
    }
  }
  return { concepto: "", acumulado, porMes }
}

function add(...items: SubtotalEstadoResultados[]): SubtotalEstadoResultados {
  const porMes: Record<string, number> = {}
  let acumulado = 0
  for (const it of items) {
    acumulado += it.acumulado
    for (const [m, v] of Object.entries(it.porMes)) {
      porMes[m] = (porMes[m] ?? 0) + v
    }
  }
  return { concepto: "", acumulado, porMes }
}

// ─── Main merge ───────────────────────────────────────────────────────────────

/**
 * Merge an array of EstadoResultados into one combined report.
 * Input array should be sorted chronologically (oldest first).
 * Returns the first element unchanged when there is only one.
 */
export function mergeEstadoResultados(ers: EstadoResultados[]): EstadoResultados {
  if (ers.length === 0) {
    throw new Error("No hay informes para combinar")
  }
  if (ers.length === 1) return ers[0]

  // 1. Union of all months, sorted
  const meses = Array.from(new Set(ers.flatMap(er => er.meses))).sort()

  // 2. Merge each section
  const sections: Record<SectionKey, LineaEstadoResultados[]> = {} as any

  for (const key of SECTION_KEYS) {
    // Map concepto → merged line
    const lineaMap = new Map<string, LineaEstadoResultados>()

    for (const er of ers) {
      for (const linea of er[key]) {
        const existing = lineaMap.get(linea.concepto)
        if (!existing) {
          // First time we see this line — clone it with a fresh porMes
          lineaMap.set(linea.concepto, {
            ...linea,
            porMes: { ...linea.porMes },
          })
        } else {
          // Same account appeared in another file — merge its porMes values
          for (const [mes, val] of Object.entries(linea.porMes)) {
            if (val !== 0) {
              existing.porMes[mes] = (existing.porMes[mes] ?? 0) + val
            }
          }
          // Union the account codes list
          for (const c of linea.cuentas) {
            if (!existing.cuentas.includes(c)) existing.cuentas.push(c)
          }
        }
      }
    }

    // 3. Re-derive acumulado from porMes to avoid double-counting saldo inicial
    sections[key] = Array.from(lineaMap.values()).map(l => ({
      ...l,
      acumulado: Object.values(l.porMes).reduce((a, b) => a + b, 0),
    }))
  }

  // 4. Recompute all subtotals
  const total_ingresos_operacionales = {
    ...sumLines(sections.ingresos_operacionales, meses),
    concepto: "Total Ingresos Operacionales",
  }
  const total_costos_ventas = {
    ...sumLines(sections.costos_ventas, meses),
    concepto: "Total Costos de Ventas",
  }
  const utilidad_bruta = {
    ...subtract(total_ingresos_operacionales, total_costos_ventas),
    concepto: "Utilidad Bruta",
  }
  const total_gastos_administrativos = {
    ...sumLines(sections.gastos_administrativos, meses),
    concepto: "Total Gastos Administrativos",
  }
  const total_gastos_ventas = {
    ...sumLines(sections.gastos_ventas, meses),
    concepto: "Total Gastos de Ventas",
  }
  const utilidad_operacional = {
    ...subtract(utilidad_bruta, total_gastos_administrativos, total_gastos_ventas),
    concepto: "Utilidad Operacional",
  }
  const total_ingresos_no_op = {
    ...sumLines(sections.ingresos_no_operacionales, meses),
    concepto: "Total Ingresos No Operacionales",
  }
  const total_gastos_no_op = {
    ...sumLines(sections.gastos_no_operacionales, meses),
    concepto: "Total Gastos No Operacionales",
  }
  const utilidad_antes_impuestos = {
    ...subtract(
      add(utilidad_operacional, total_ingresos_no_op),
      total_gastos_no_op
    ),
    concepto: "Utilidad Antes de Impuestos",
  }
  const total_impuesto_renta = {
    ...sumLines(sections.impuesto_renta, meses),
    concepto: "Impuesto de Renta",
  }
  const utilidad_neta = {
    ...subtract(utilidad_antes_impuestos, total_impuesto_renta),
    concepto: "Utilidad Neta",
  }

  return {
    meses,
    ...sections,
    total_ingresos_operacionales,
    total_costos_ventas,
    utilidad_bruta,
    total_gastos_administrativos,
    total_gastos_ventas,
    utilidad_operacional,
    total_ingresos_no_op,
    total_gastos_no_op,
    utilidad_antes_impuestos,
    total_impuesto_renta,
    utilidad_neta,
  }
}

// ─── Re-apply exceptions to a stored result ───────────────────────────────────

/**
 * Re-classify lines in an already-computed EstadoResultados according to the
 * current exception list, then recompute all subtotals.
 *
 * This allows stored archive results to reflect new or updated exceptions
 * without re-uploading the original Excel files.
 *
 * Uses the `cuentas` array on each line (account codes) to match against
 * exception prefixes. When a line matches an exception whose target category
 * differs from the line's current section, the line is moved there.
 */
export function reclasificarEstadoResultados(
  er: EstadoResultados,
  excepciones: Pick<ExcepcionClasificacion, "prefijoCuenta" | "categoriaDestino">[]
): EstadoResultados {
  if (excepciones.length === 0) return er

  const meses = er.meses

  // Clone all section arrays (shallow — we replace the arrays, not mutate elements)
  const sections: Record<SectionKey, LineaEstadoResultados[]> = {
    ingresos_operacionales:    [...er.ingresos_operacionales],
    costos_ventas:             [...er.costos_ventas],
    gastos_administrativos:    [...er.gastos_administrativos],
    gastos_ventas:             [...er.gastos_ventas],
    ingresos_no_operacionales: [...er.ingresos_no_operacionales],
    gastos_no_operacionales:   [...er.gastos_no_operacionales],
    impuesto_renta:            [...er.impuesto_renta],
  }

  let changed = false

  for (const fromKey of SECTION_KEYS) {
    const toRemove: LineaEstadoResultados[] = []

    for (const linea of sections[fromKey]) {
      // Find the exception with the longest matching prefix for any of this line's account codes
      let bestMatch: Pick<ExcepcionClasificacion, "prefijoCuenta" | "categoriaDestino"> | null = null

      for (const codigo of linea.cuentas) {
        for (const exc of excepciones) {
          if (
            codigo.startsWith(exc.prefijoCuenta) &&
            (bestMatch === null || exc.prefijoCuenta.length > bestMatch.prefijoCuenta.length)
          ) {
            bestMatch = exc
          }
        }
      }

      if (
        bestMatch &&
        bestMatch.categoriaDestino !== "ignorar" &&
        bestMatch.categoriaDestino !== fromKey
      ) {
        const toKey = bestMatch.categoriaDestino as SectionKey
        if (SECTION_KEYS.includes(toKey)) {
          toRemove.push(linea)
          sections[toKey] = [...sections[toKey], { ...linea, categoria: bestMatch.categoriaDestino }]
          changed = true
        }
      }
    }

    if (toRemove.length > 0) {
      sections[fromKey] = sections[fromKey].filter(l => !toRemove.includes(l))
    }
  }

  if (!changed) return er

  // Recompute subtotals
  const total_ingresos_operacionales = { ...sumLines(sections.ingresos_operacionales, meses), concepto: "Total Ingresos Operacionales" }
  const total_costos_ventas          = { ...sumLines(sections.costos_ventas, meses),             concepto: "Total Costos de Ventas" }
  const utilidad_bruta               = { ...subtract(total_ingresos_operacionales, total_costos_ventas), concepto: "Utilidad Bruta" }
  const total_gastos_administrativos = { ...sumLines(sections.gastos_administrativos, meses),    concepto: "Total Gastos Administrativos" }
  const total_gastos_ventas          = { ...sumLines(sections.gastos_ventas, meses),             concepto: "Total Gastos de Ventas" }
  const utilidad_operacional         = { ...subtract(utilidad_bruta, total_gastos_administrativos, total_gastos_ventas), concepto: "Utilidad Operacional" }
  const total_ingresos_no_op         = { ...sumLines(sections.ingresos_no_operacionales, meses), concepto: "Total Ingresos No Operacionales" }
  const total_gastos_no_op           = { ...sumLines(sections.gastos_no_operacionales, meses),   concepto: "Total Gastos No Operacionales" }
  const utilidad_antes_impuestos     = { ...subtract(add(utilidad_operacional, total_ingresos_no_op), total_gastos_no_op), concepto: "Utilidad Antes de Impuestos" }
  const total_impuesto_renta         = { ...sumLines(sections.impuesto_renta, meses),            concepto: "Impuesto de Renta" }
  const utilidad_neta                = { ...subtract(utilidad_antes_impuestos, total_impuesto_renta), concepto: "Utilidad Neta" }

  return {
    meses,
    ...sections,
    total_ingresos_operacionales,
    total_costos_ventas,
    utilidad_bruta,
    total_gastos_administrativos,
    total_gastos_ventas,
    utilidad_operacional,
    total_ingresos_no_op,
    total_gastos_no_op,
    utilidad_antes_impuestos,
    total_impuesto_renta,
    utilidad_neta,
  }
}
