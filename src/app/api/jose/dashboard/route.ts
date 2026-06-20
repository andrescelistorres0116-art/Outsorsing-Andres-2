import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { joseAuth, formatFecha, mapEstado, formatPeriodo } from "@/lib/jose-auth"

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
      prisma.empresa.count({ where: { estado: "ACTIVA", tipoNomina: { not: null } } }),
      prisma.obligacionTributaria.count({
        where: {
          OR: [
            { estado: "VENCIDO" },
            { estado: { in: ["PENDIENTE", "EN_PROCESO"] }, fechaVencimiento: { lt: now } },
          ],
        },
      }),
      prisma.obligacionTributaria.findMany({
        where: {
          estado: { in: ["PENDIENTE", "EN_PROCESO"] },
          fechaVencimiento: { gte: now, lte: in5 },
        },
        orderBy: { fechaVencimiento: "asc" },
        include: { empresa: { select: { razonSocial: true, nit: true } } },
        take: 20,
      }),
      prisma.obligacionTributaria.count(),
      prisma.obligacionTributaria.count({ where: { estado: { in: ["PRESENTADO", "PAGADO"] } } }),
    ])

    return NextResponse.json({
      fecha_consulta: formatFecha(now),
      empresas_activas: empresasActivas,
      empresas_con_nomina: empresasConNomina,
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
        estado: mapEstado(o.estado),
      })),
    })
  } catch (e) {
    console.error("[jose/dashboard]", e)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
