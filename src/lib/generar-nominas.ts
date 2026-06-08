import { prisma } from "@/lib/prisma"
import { PeriodicidadNomina, PeriodoNomina, EstadoReporteNomina } from "@prisma/client"

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

  for (const periodo of periodos) {
    try {
      await prisma.reporteNomina.create({
        data: {
          empresaId,
          periodo,
          mes,
          año,
          estado: EstadoReporteNomina.BORRADOR,
          sinNovedades: false,
          ...periodDates(año, mes, periodo),
        },
      })
      result.creados++
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

/** Devuelve { mes, año } del mes actual en hora local. */
export function mesActual(): { mes: number; año: number } {
  const now = new Date()
  return { mes: now.getMonth() + 1, año: now.getFullYear() }
}
