/**
 * clasificacion.ts
 *
 * PUC (Plan Único de Cuentas — Decreto 2650) classification engine.
 *
 * Default rules (Colombia, class prefixes):
 *   41**  → ingresos_operacionales
 *   42**  → ingresos_no_operacionales
 *   51**  → gastos_administrativos
 *   52**  → gastos_ventas
 *   53**  → gastos_no_operacionales
 *   54**  → gastos_no_operacionales   (intereses y comisiones)
 *   59**  → gastos_no_operacionales   (provisions / other)
 *   6***  → costos_ventas
 *   7***  → costos_ventas             (manufactura)
 *   81**  → impuesto_renta
 *   Everything else → ignorar
 *
 * Grouped display lines ("Gastos de personal"):
 *   5105** + 5205** are merged into a single "Gastos de personal" line.
 *
 * Per-empresa exceptions override the default prefix rules:
 *   E.g. "428" → "ingresos_operacionales" for Inversiones Diazar S.A.S.
 */

import type {
  CategoriaEstadoResultados,
  ExcepcionClasificacion,
} from "./types"

// ─── Default PUC rules ────────────────────────────────────────────────────────

interface PrefijRule {
  prefijo: string                         // leading digits to match
  categoria: CategoriaEstadoResultados
}

// Ordered from most-specific to least-specific so longer prefixes win
const DEFAULT_RULES: PrefijRule[] = [
  // Income
  { prefijo: "41", categoria: "ingresos_operacionales" },
  { prefijo: "42", categoria: "ingresos_no_operacionales" },
  // Expenses
  { prefijo: "51", categoria: "gastos_administrativos" },
  { prefijo: "52", categoria: "gastos_ventas" },
  { prefijo: "53", categoria: "gastos_no_operacionales" },
  { prefijo: "54", categoria: "gastos_no_operacionales" },
  { prefijo: "59", categoria: "gastos_no_operacionales" },
  // Cost of sales
  { prefijo: "6",  categoria: "costos_ventas" },
  { prefijo: "7",  categoria: "costos_ventas" },
  // Tax
  { prefijo: "81", categoria: "impuesto_renta" },
]

// ─── "Gastos de personal" grouping ───────────────────────────────────────────

/**
 * Account prefixes that are merged into the "Gastos de personal" display line.
 * These still retain their parent categoria (admin / ventas) — the grouping
 * is purely visual; the calculator handles it separately.
 */
export const GASTOS_PERSONAL_PREFIJOS = ["5105", "5205"]

export function isGastosPersonal(codigo: string): boolean {
  return GASTOS_PERSONAL_PREFIJOS.some(p => codigo.startsWith(p))
}

// ─── Classification function ──────────────────────────────────────────────────

/**
 * Determine the CategoriaEstadoResultados for a single account code, taking
 * into account any per-empresa exception overrides.
 *
 * @param codigo     Full account code (e.g. "42800101")
 * @param excepciones  List of exceptions for this empresa (from DB)
 */
export function clasificarCuenta(
  codigo: string,
  excepciones: Pick<ExcepcionClasificacion, "prefijoCuenta" | "categoriaDestino">[] = []
): CategoriaEstadoResultados {
  // 1. Check exceptions first (longest prefix wins in case of overlap)
  const matchingExceptions = excepciones
    .filter(e => codigo.startsWith(e.prefijoCuenta))
    .sort((a, b) => b.prefijoCuenta.length - a.prefijoCuenta.length)

  if (matchingExceptions.length > 0) {
    return matchingExceptions[0].categoriaDestino
  }

  // 2. Default PUC rules (sorted longest-first for specificity)
  const sortedRules = [...DEFAULT_RULES].sort(
    (a, b) => b.prefijo.length - a.prefijo.length
  )
  for (const rule of sortedRules) {
    if (codigo.startsWith(rule.prefijo)) return rule.categoria
  }

  return "ignorar"
}

// ─── Sign convention ──────────────────────────────────────────────────────────

/**
 * Compute the net contribution of an account for a given month (or the
 * saldo inicial period), returning a positive amount in the "natural"
 * direction for the categoria:
 *
 *   Income accounts  → net = creditos - debitos  (credit-normal)
 *   Expense accounts → net = debitos - creditos  (debit-normal)
 *
 * The result is always expressed as a positive number for display purposes;
 * sign inversion for P&L subtraction happens in the calculator.
 */
export function netoCuenta(
  debitos: number,
  creditos: number,
  categoria: CategoriaEstadoResultados
): number {
  switch (categoria) {
    case "ingresos_operacionales":
    case "ingresos_no_operacionales":
      return creditos - debitos

    case "gastos_administrativos":
    case "gastos_ventas":
    case "gastos_no_operacionales":
    case "costos_ventas":
    case "impuesto_renta":
      return debitos - creditos

    case "ignorar":
    default:
      return 0
  }
}

/**
 * Net contribution of the saldo inicial for an account.
 * saldoInicial is stored as (debito_balance - credito_balance), so for
 * income accounts (credit-normal) it's typically negative, meaning we negate it.
 */
export function netoSaldoInicial(
  saldoInicial: number,
  categoria: CategoriaEstadoResultados
): number {
  switch (categoria) {
    case "ingresos_operacionales":
    case "ingresos_no_operacionales":
      return -saldoInicial  // credit-normal: opening credit balance is positive income

    case "gastos_administrativos":
    case "gastos_ventas":
    case "gastos_no_operacionales":
    case "costos_ventas":
    case "impuesto_renta":
      return saldoInicial   // debit-normal: opening debit balance is positive expense

    case "ignorar":
    default:
      return 0
  }
}

// ─── Default exception set (Inversiones Diazar S.A.S.) ───────────────────────

/**
 * These exceptions are seeded in the DB but are also exported here so they
 * can be used in the migration seed and in any in-memory test.
 */
export const EXCEPCIONES_DIAZAR: Omit<ExcepcionClasificacion, "id" | "empresaId">[] = [
  {
    prefijoCuenta:     "428",
    categoriaOriginal: "ingresos_no_operacionales",
    categoriaDestino:  "ingresos_operacionales",
    descripcion:       "Diazar: cuenta 428xxxxx clasificada como ingreso operacional",
  },
]
