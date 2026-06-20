import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { joseAuth, formatFecha, mapEstado, formatPeriodo } from "@/lib/jose-auth"
import { estadoEfectivo, TIPOS_NOMINA } from "@/lib/calendario-helpers"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const denied = joseAuth(request)
  if (denied) return denied

  try {
    const now = new Date()
    const in5 = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)

    const [
      empresasActivas,
      empresasConNomina,
      obligacionesVencidas,
      proximasObligaciones,
      totalObligaciones,
      obligacionesCumplidas,
    ] = await Promise.all([
      prisma.empresa.count({ where: { estado: "ACTIVA" } }),

      // BUG 1 FIX: derive from actual nómina obligations, not the static
      // tipoNomina field on Empresa which is only set via the company form.
      prisma.empresa.count({
        where: {
          estado: "ACTIVA",
          obligaciones: {
            some: { tipoObligacion: { in: [...TIPOS_NOMINA] } },
          },
        },
      }),

      // BUG 2 FIX: use boolean flags (same logic as estadoEfectivo) instead
      // of the estado_workflow enum which can be stale.
      // "vencido" = past due date AND none of the 3 completion steps done.
      prisma.obligacionTributaria.count({
        where: {
          contabilizado: false,
          declarado: false,
          pagado: false,
          fechaVencimiento: { lt: now },
        },
      }),

      // Próximas: still use workflow estado for the "upcoming" list since
      // these haven't been processed yet and the enum is reliable for future items.
      prisma.obligacionTributaria.findMany({
        where: {
          pagado: false,
          declarado: false,
          fechaVencimiento: { gte: now, lte: in5 },
        },
        orderBy: { fechaVencimiento: "asc" },
        include: { empresa: { select: { razonSocial: true, nit: true } } },
        take: 20,
      }),

      prisma.obligacionTributaria.count(),

      // cumplimiento: pagado=true counts as fulfilled (source of truth)
      prisma.obligacionTributaria.count({ where: { pagado: true } }),
    ])

    return NextResponse.json({
      fecha_consulta: formatFecha(now),
      empresas_activas: empresasActivas,
      // Number of active empresas with at least one "Nómina" or "Nómina Electrónica" obligation
      empresas_con_nomina: empresasConNomina,
      // Obligations past due with no step completed (matches estado="vencido" in calendario)
      obligaciones_vencidas: obligacionesVencidas,
      proximas_a_vencer_5_dias: proximasObligaciones.length,
      cumplimiento_general_pct:
        totalObligaciones > 0
          ? Math.round((obligacionesCumplidas / totalObligaciones) * 1000) / 10
          : 100,
      obligaciones_proximas: proximasObligaciones.map((o) => ({
        empresa: o.empresa.razonSocial,
        nit: o.empresa.nit,
        obligacion: o.tipoObligacion,
        periodo: formatPeriodo(Number(o.periodo) || 0, o.periodicidad, o.año),
        fecha_vencimiento: formatFecha(o.fechaVencimiento),
        estado: estadoEfectivo(
          o.pagado ?? false,
          o.declarado ?? false,
          o.contabilizado ?? false,
          o.fechaVencimiento,
          now
        ),
      })),
    })
  } catch (e) {
    console.error("[jose/dashboard]", e)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
