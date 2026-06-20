import { describe, it, expect } from "vitest"
import { estadoEfectivo, buildEstadoWhere, buildDateRange } from "@/lib/calendario-helpers"

const NOW = new Date("2026-06-20T12:00:00.000Z")
const PAST = new Date("2026-06-10T00:00:00.000Z")  // 10 days ago
const FUTURE = new Date("2026-06-30T00:00:00.000Z") // 10 days ahead

// ─── estadoEfectivo ───────────────────────────────────────────────────────────

describe("estadoEfectivo", () => {
  it("returns 'pagado' when pagado=true regardless of other flags", () => {
    expect(estadoEfectivo(true, true, true, PAST, NOW)).toBe("pagado")
    expect(estadoEfectivo(true, false, false, FUTURE, NOW)).toBe("pagado")
  })

  it("returns 'presentado' when declarado=true and pagado=false", () => {
    expect(estadoEfectivo(false, true, true, PAST, NOW)).toBe("presentado")
    expect(estadoEfectivo(false, true, false, FUTURE, NOW)).toBe("presentado")
  })

  it("returns 'en_proceso' when contabilizado=true, declarado=false, pagado=false", () => {
    expect(estadoEfectivo(false, false, true, PAST, NOW)).toBe("en_proceso")
    expect(estadoEfectivo(false, false, true, FUTURE, NOW)).toBe("en_proceso")
  })

  it("returns 'vencido' when all flags false and due date is in the past", () => {
    expect(estadoEfectivo(false, false, false, PAST, NOW)).toBe("vencido")
  })

  it("returns 'pendiente' when all flags false and due date is in the future", () => {
    expect(estadoEfectivo(false, false, false, FUTURE, NOW)).toBe("pendiente")
  })

  // Regression: contabilizado=true must NOT become "vencido" even if past due
  it("returns 'en_proceso' (not 'vencido') when contabilizado=true and past due", () => {
    const result = estadoEfectivo(false, false, true, PAST, NOW)
    expect(result).toBe("en_proceso")
    expect(result).not.toBe("vencido")
  })
})

// ─── buildEstadoWhere ─────────────────────────────────────────────────────────

describe("buildEstadoWhere", () => {
  it("vencido: includes contabilizado:false so en_proceso records are excluded", () => {
    const where = buildEstadoWhere("vencido")
    expect(where).toMatchObject({
      contabilizado: false,
      declarado: false,
      pagado: false,
    })
  })

  it("pendiente: excludes all completed flags", () => {
    const where = buildEstadoWhere("pendiente")
    expect(where).toMatchObject({
      contabilizado: false,
      declarado: false,
      pagado: false,
    })
  })

  it("pagado: only checks pagado flag", () => {
    expect(buildEstadoWhere("pagado")).toEqual({ pagado: true })
  })

  it("presentado: declarado=true and pagado=false", () => {
    expect(buildEstadoWhere("presentado")).toEqual({ declarado: true, pagado: false })
  })

  it("en_proceso: contabilizado=true, declarado=false, pagado=false", () => {
    expect(buildEstadoWhere("en_proceso")).toEqual({
      contabilizado: true,
      declarado: false,
      pagado: false,
    })
  })

  it("undefined: returns empty object (no filter)", () => {
    expect(buildEstadoWhere(undefined)).toEqual({})
  })

  // ── Regression: vencido filter must not return pendiente records ─────────────
  //
  // A "pendiente" record has: contabilizado=false, declarado=false, pagado=false,
  // fechaVencimiento >= now. The vencido WHERE includes contabilizado:false,
  // declarado:false, pagado:false — which WOULD match a pendiente record on flags
  // alone. However the DATE RANGE (hasta = now) is what excludes future dates.
  // This test verifies that the WHERE object from buildEstadoWhere("vencido")
  // does NOT accidentally relax the boolean conditions that estadoEfectivo needs.
  it("vencido WHERE is a strict superset of the boolean conditions for 'vencido' in estadoEfectivo", () => {
    const where = buildEstadoWhere("vencido") as Record<string, boolean>
    // Any record passing the vencido WHERE MUST have all 3 flags = false.
    // Combined with hasta <= now (enforced by buildDateRange), estadoEfectivo
    // will return "vencido" and never "pendiente", "en_proceso", or "presentado".
    expect(where.contabilizado).toBe(false)
    expect(where.declarado).toBe(false)
    expect(where.pagado).toBe(false)
  })
})

// ─── buildDateRange ───────────────────────────────────────────────────────────

describe("buildDateRange", () => {
  it("vencido: hasta defaults to now (never future)", () => {
    const { hasta } = buildDateRange("vencido", undefined, undefined, NOW)
    expect(hasta.getTime()).toBe(NOW.getTime())
  })

  it("vencido: hasta is capped at now even when caller provides future date", () => {
    const futureDate = "2026-12-31"
    const { hasta } = buildDateRange("vencido", undefined, futureDate, NOW)
    // Must be capped at NOW, not at the provided future date
    expect(hasta.getTime()).toBe(NOW.getTime())
    expect(hasta.getTime()).toBeLessThanOrEqual(NOW.getTime())
  })

  it("vencido: hasta respects past hastaParam (caller may narrow further)", () => {
    const pastDate = "2026-06-01"
    const { hasta } = buildDateRange("vencido", undefined, pastDate, NOW)
    expect(hasta).toEqual(new Date(pastDate))
    expect(hasta < NOW).toBe(true)
  })

  it("vencido: desde defaults to 365 days ago", () => {
    const { desde } = buildDateRange("vencido", undefined, undefined, NOW)
    const expected = new Date(NOW.getTime() - 365 * 24 * 60 * 60 * 1000)
    expect(desde.getTime()).toBe(expected.getTime())
  })

  it("non-vencido: hasta defaults to now+30 days", () => {
    const { hasta } = buildDateRange("pendiente", undefined, undefined, NOW)
    const expected = new Date(NOW.getTime() + 30 * 24 * 60 * 60 * 1000)
    expect(hasta.getTime()).toBe(expected.getTime())
  })

  it("non-vencido: hasta accepts future hastaParam without capping", () => {
    const { hasta } = buildDateRange("pendiente", undefined, "2026-12-31", NOW)
    expect(hasta).toEqual(new Date("2026-12-31"))
  })
})
