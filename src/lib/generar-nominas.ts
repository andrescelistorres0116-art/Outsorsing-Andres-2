import { prisma } from "@/lib/prisma"
import { PeriodicidadNomina, PeriodoNomina, EstadoReporteNomina, TipoNovedad, UserRole } from "@prisma/client"

// ── Helpers ───────────────────────────────────────────────────────────────────

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate() // month is 1-based
}

function pad(n: number): string {
  return String(n).padStart(2, "0")
}

function periodDates(año: number, mes: number, periodo: PeriodoNomina) {
  const last = lastDayOfMonth(año, mes)
  const m = pad(mes)
  if (periodo === PeriodoNomina.PRIMERA_QUINCENA) {
    return {
      fechaInicioPeriodo: new Date(`${año}-${m}-01`),
      fechaFinPeriodo:    new Date(`${año}-${m}-15`),
    }
  }
  if (periodo === PeriodoNomina.SEGUNDA_QUINCENA) {
    return {
      fechaInicioPeriodo: new Date(`${año}-${m}-16`),
      fechaFinPeriodo:    new Date(`${año}-${m}-${pad(last)}`),
    }
  }
  // MENSUAL
  return {
    fechaInicioPeriodo: new Date(`${año}-${m}-01`),
    fechaFinPeriodo:    new Date(`${año}-${m}-${pad(last)}`),
  }
}

function periodosDePeriodicidad(p: PeriodicidadNomina): PeriodoNomina[] {
  return p === PeriodicidadNomina.QUINCENAL
    ? [PeriodoNomina.PRIMERA_QUINCENA, PeriodoNomina.SEGUNDA_QUINCENA]
    : [PeriodoNomina.MENSUAL]
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface GenerarResult {
  creados:  number
  omitidos: number // ya existían (P2002)
  errores:  number
}

/**
 * Genera los reportes de nómina faltantes para TODAS las empresas activas
 * con periodicidadNomina configurada, para el mes/año indicado.
 * Es idempotente: los duplicados se ignoran silenciosamente.
 */
export async function generarReportesMes(
  mes: number,
  año: number,
): Promise<GenerarResult> {
  const empresas = await prisma.empresa.findMany({
    where: { estado: "ACTIVA", periodicidadNomina: { not: null } },
    select: { id: true, periodicidadNomina: true },
  })

  const result: GenerarResult = { creados: 0, omitidos: 0, errores: 0 }

  for (const empresa of empresas) {
    if (!empresa.periodicidadNomina) continue
    const sub = await generarReportesParaEmpresa(
      empresa.id,
      empresa.periodicidadNomina,
      mes,
      año,
    )
    result.creados  += sub.creados
    result.omitidos += sub.omitidos
    result.errores  += sub.errores
  }

  return result
}

/**
 * Genera los reportes de nómina faltantes para UNA empresa específica,
 * para el mes/año indicado.
 */
export async function generarReportesParaEmpresa(
  empresaId:    string,
  periodicidad: PeriodicidadNomina,
  mes:          number,
  año:          number,
): Promise<GenerarResult> {
  const periodos = periodosDePeriodicidad(periodicidad)
  const result: GenerarResult = { creados: 0, omitidos: 0, errores: 0 }

  // Use a system user id for auto-generated novedades: pick any ADMIN user
  const adminUser = await prisma.user.findFirst({ where: { role: UserRole.ADMIN }, select: { id: true } })
  const systemUserId = adminUser?.id ?? ""

  for (const periodo of periodos) {
    try {
      const dates = periodDates(año, mes, periodo)
      const reporte = await prisma.reporteNomina.create({
        data: {
          empresaId,
          periodo,
          mes,
          año,
          estado: EstadoReporteNomina.BORRADOR,
          sinNovedades: false,
          ...dates,
        },
      })
      result.creados++

      // Fire-and-forget: auto-generate libranza novedades for newly created report
      if (systemUserId) {
        generarNovedadesLibranzaParaReporte(
          reporte.id, empresaId, mes, año, periodo,
          dates.fechaInicioPeriodo, dates.fechaFinPeriodo, systemUserId,
        ).catch(e => console.error("[generar-libranzas] auto-gen error:", e?.message))
      }
    } catch (e: any) {
      if (e?.code === "P2002") {
        result.omitidos++ // constraint único — ya existe, no es error
      } else {
        console.error(`[generar-nominas] empresa=${empresaId} periodo=${periodo}:`, e?.message)
        result.errores++
      }
    }
  }

  return result
}

/**
 * Auto-generates LIBRANZA novedades for all active libranzas of active employees
 * for the given report. Idempotent — skips if novedad already exists for that
 * libranza in this report. Advances cuotaActual after each creation.
 */
export async function generarNovedadesLibranzaParaReporte(
  reporteId:          string,
  empresaId:          string,
  mes:                number,
  año:                number,
  periodo:            PeriodoNomina,
  fechaInicioPeriodo: Date,
  fechaFinPeriodo:    Date,
  creadoPorId:        string,
): Promise<{ creadas: number; omitidas: number; errores: number }> {
  const result = { creadas: 0, omitidas: 0, errores: 0 }

  // Employees active during the period
  const empleados = await prisma.empleado.findMany({
    where: {
      empresaId,
      fechaIngreso: { lte: fechaFinPeriodo },
      OR: [
        { fechaRetiro: null },
        { fechaRetiro: { gte: fechaInicioPeriodo } },
      ],
    },
    select: { id: true },
  })

  for (const emp of empleados) {
    const libranzas = await prisma.libranza.findMany({
      where: { empleadoId: emp.id, empresaId, activa: true },
    })

    for (const lib of libranzas) {
      // Check idempotency: skip if this libranza already has a novedad in this report
      const existing = await prisma.novedadNomina.findFirst({
        where: { reporteId, libranzaId: lib.id },
      })
      if (existing) { result.omitidas++; continue }

      try {
        await prisma.novedadNomina.create({
          data: {
            empresaId,
            empleadoId: emp.id,
            reporteId,
            periodo,
            mes,
            año,
            tipoNovedad: TipoNovedad.LIBRANZA,
            libranzaId: lib.id,
            valorCuota: lib.valorCuota,
            numeroCuotas: lib.numeroCuotas,
            cuotaNumero: lib.cuotaActual,
            fechaInicioNovedad: fechaInicioPeriodo,
            creadoPorId,
          },
        })

        // Advance cuota and deactivate libranza if fully paid
        const nuevaCuota = lib.cuotaActual + 1
        await prisma.libranza.update({
          where: { id: lib.id },
          data: {
            cuotaActual: nuevaCuota,
            activa: nuevaCuota <= lib.numeroCuotas,
          },
        })

        result.creadas++
      } catch (e: any) {
        console.error(`[generar-libranzas] reporte=${reporteId} libranza=${lib.id}:`, e?.message)
        result.errores++
      }
    }
  }

  return result
}

/** Devuelve { mes, año } del mes actual en hora local. */
export function mesActual(): { mes: number; año: number } {
  const now = new Date()
  return { mes: now.getMonth() + 1, año: now.getFullYear() }
}
