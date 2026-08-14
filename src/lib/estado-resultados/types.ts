/**
 * Estado de Resultados — shared TypeScript types
 *
 * Designed to be software-agnostic: the parser layer produces
 * LibroAuxiliarParsed; the classification + calculator layers consume it.
 */

// ─── Parser output ────────────────────────────────────────────────────────────

/** Raw movements for a single account extracted from the source file */
export interface CuentaMovimientos {
  /** Full account code, e.g. "51050110" */
  codigo: string
  /** Human-readable account name */
  nombre: string
  /**
   * Accumulated opening balance BEFORE the first month in the file.
   * Positive = debit-side opening balance; negative = credit-side.
   * For income accounts (normal credit balance) this will usually be negative.
   */
  saldoInicial: number
  /**
   * Net movements per calendar month.
   * Key format: "YYYY-MM" (e.g. "2026-07").
   * debitos / creditos are always positive amounts.
   */
  movimientosPorMes: Record<string, { debitos: number; creditos: number }>
}

/** A single movement row captured from the libro auxiliar (for drill-down) */
export interface TransaccionLibro {
  /** Account code (e.g. "51050601") */
  codigo: string
  /** Account name */
  concepto: string
  /** YYYY-MM */
  mes: string
  /** YYYY-MM-DD — best effort; falls back to YYYY-MM-01 */
  fecha: string
  /** Description / nota column from the libro auxiliar */
  nota: string
  debito: number
  credito: number
}

/** Complete parsed book */
export interface LibroAuxiliarParsed {
  softwareContable: "world_office" | string
  /** YYYY-MM strings sorted chronologically */
  meses: string[]
  cuentas: CuentaMovimientos[]
  /** Individual movements captured for drill-down (one entry per non-zero row) */
  transacciones: TransaccionLibro[]
}

// ─── Classification ───────────────────────────────────────────────────────────

export type CategoriaEstadoResultados =
  | "ingresos_operacionales"
  | "ingresos_no_operacionales"
  | "gastos_administrativos"
  | "gastos_ventas"
  | "gastos_no_operacionales"
  | "costos_ventas"
  | "impuesto_renta"
  | "ignorar"   // accounts that should not appear in the report

/** Stored in DB; allows per-empresa overrides of the default PUC classification */
export interface ExcepcionClasificacion {
  id: string
  empresaId: string
  prefijoCuenta: string              // e.g. "428" — all accounts starting with this are overridden
  categoriaOriginal: CategoriaEstadoResultados | null
  categoriaDestino: CategoriaEstadoResultados
  descripcion?: string | null
}

// ─── Calculator / Report output ───────────────────────────────────────────────

/** A single line in the income statement */
export interface LineaEstadoResultados {
  concepto: string
  categoria: CategoriaEstadoResultados
  /**
   * true when multiple sub-accounts are merged into one display line
   * (e.g. "Gastos de personal" groups 5105** + 5205**)
   */
  esGrupo?: boolean
  /** Account codes that roll up into this line */
  cuentas: string[]
  /** Cumulative net: SALDO INICIAL contribution + all months' movements */
  acumulado: number
  /** Net per month; key = "YYYY-MM". Positive = income, positive = expense (caller interprets sign) */
  porMes: Record<string, number>
}

/** A computed subtotal row */
export interface SubtotalEstadoResultados {
  concepto: string
  acumulado: number
  porMes: Record<string, number>
}

/** Full income statement ready for rendering / export */
export interface EstadoResultados {
  /** YYYY-MM sorted list of months that appear as columns */
  meses: string[]

  // Section arrays (each may be empty)
  ingresos_operacionales: LineaEstadoResultados[]
  costos_ventas: LineaEstadoResultados[]
  gastos_administrativos: LineaEstadoResultados[]
  gastos_ventas: LineaEstadoResultados[]
  ingresos_no_operacionales: LineaEstadoResultados[]
  gastos_no_operacionales: LineaEstadoResultados[]
  impuesto_renta: LineaEstadoResultados[]

  // Computed totals
  total_ingresos_operacionales: SubtotalEstadoResultados
  total_costos_ventas: SubtotalEstadoResultados
  utilidad_bruta: SubtotalEstadoResultados
  total_gastos_administrativos: SubtotalEstadoResultados
  total_gastos_ventas: SubtotalEstadoResultados
  utilidad_operacional: SubtotalEstadoResultados
  total_ingresos_no_op: SubtotalEstadoResultados
  total_gastos_no_op: SubtotalEstadoResultados
  utilidad_antes_impuestos: SubtotalEstadoResultados
  total_impuesto_renta: SubtotalEstadoResultados
  utilidad_neta: SubtotalEstadoResultados
}

// ─── API shapes ───────────────────────────────────────────────────────────────

export interface ProcesarRequest {
  empresaId: string
  /** base64-encoded Excel file contents */
  archivoBase64: string
  nombreArchivo: string
  softwareContable?: string
}

export interface ProcesarResponse {
  ok: boolean
  estadoResultados?: EstadoResultados
  error?: string
}
