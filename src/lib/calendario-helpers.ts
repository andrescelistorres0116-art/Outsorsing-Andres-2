/**
 * Pure business-logic helpers for the calendario-tributario endpoint.
 * Extracted to a separate module so they can be unit-tested without Next.js.
 */

/**
 * Derives the real compliance status from the boolean step flags and due date.
 * Priority: pagado > declarado > contabilizado > vencido (by date) > pendiente.
 *
 * Intentionally ignores the DB `estado` enum which can lag behind because
 * staff marks individual steps without always updating the workflow state.
 */
export function estadoEfectivo(
  pagado: boolean,
  declarado: boolean,
  contabilizado: boolean,
  fechaVencimiento: Date,
  now: Date,
  noAplica = false
): string {
  if (noAplica) return "no_aplica"
  if (pagado) return "pagado"
  if (declarado) return "presentado"
  if (contabilizado) return "en_proceso"
  if (fechaVencimiento < now) return "vencido"
  return "pendiente"
}

/**
 * Maps the ?estado= query param to Prisma WHERE conditions using
 * boolean flags as the source of truth.
 *
 * The "vencido" date cap (lte: now) is NOT included here — callers must
 * ensure `hasta` is capped at `now` when estadoParam === "vencido".
 *
 * Mappings:
 *   pendiente  → none of the 3 steps done
 *   en_proceso → contabilizado=true, not declared or paid
 *   presentado → declarado=true, not yet paid
 *   pagado     → pagado=true
 *   vencido    → all 3 steps false (date range enforces past-due condition)
 */
export function buildEstadoWhere(param: string | undefined): Record<string, unknown> {
  switch (param) {
    case "pagado":
      return { pagado: true, noAplica: false }
    case "presentado":
      return { declarado: true, pagado: false, noAplica: false }
    case "en_proceso":
      return { contabilizado: true, declarado: false, pagado: false, noAplica: false }
    case "vencido":
      return { contabilizado: false, declarado: false, pagado: false, noAplica: false }
    case "pendiente":
      return { contabilizado: false, declarado: false, pagado: false, noAplica: false }
    case "no_aplica":
      return { noAplica: true }
    default:
      return {}
  }
}

/**
 * Computes the effective date range for the query.
 * Key rule: when filtering by "vencido", `hasta` is ALWAYS capped at `now`
 * (you cannot have a future obligation that is already overdue).
 */
export function buildDateRange(
  estadoParam: string | undefined,
  desdeParam: string | undefined,
  hastaParam: string | undefined,
  now: Date
): { desde: Date; hasta: Date } {
  const isVencido = estadoParam === "vencido"

  const desde = desdeParam
    ? new Date(desdeParam)
    : isVencido
      ? new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      : now

  // For vencido: cap hasta at now even if the caller supplied a future date.
  const hastaRaw = hastaParam ? new Date(hastaParam) : null
  const hasta = isVencido
    ? hastaRaw && hastaRaw < now ? hastaRaw : now
    : hastaRaw ?? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  return { desde, hasta }
}

/**
 * Returns the obligation type names that signal the empresa has nómina.
 * Centralised here so the dashboard and empresas endpoints stay in sync.
 */
export const TIPOS_NOMINA = ["Nómina", "Nómina Electrónica"] as const
