import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const now = new Date()
    const sevenDaysFromNow = new Date(now)
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    const [
      empresasActivas,
      empresasInactivas,
      obligacionesVencidas,
      obligacionesSemana,
      totalObligaciones,
      obligacionesCumplidas,
      reportesNominaPendientes,
    ] = await Promise.all([
      // Active companies
      prisma.empresa.count({
        where: { estado: "ACTIVA" },
      }),

      // Inactive companies
      prisma.empresa.count({
        where: { estado: "INACTIVA" },
      }),

      // Overdue obligations (estado VENCIDO or past due date and not completed)
      prisma.obligacionTributaria.count({
        where: {
          OR: [
            { estado: "VENCIDO" },
            {
              estado: { in: ["PENDIENTE", "EN_PROCESO"] },
              fechaVencimiento: { lt: now },
            },
          ],
        },
      }),

      // Obligations due within the next 7 days (not yet completed)
      prisma.obligacionTributaria.count({
        where: {
          estado: { in: ["PENDIENTE", "EN_PROCESO"] },
          fechaVencimiento: {
            gte: now,
            lte: sevenDaysFromNow,
          },
        },
      }),

      // Total obligations (for compliance calculation)
      prisma.obligacionTributaria.count(),

      // Completed obligations (PRESENTADO or PAGADO)
      prisma.obligacionTributaria.count({
        where: {
          estado: { in: ["PRESENTADO", "PAGADO"] },
        },
      }),

      // Pending payroll reports (BORRADOR or ENVIADO = not yet approved)
      prisma.reporteNomina.count({
        where: {
          estado: { in: ["BORRADOR", "ENVIADO"] },
        },
      }),
    ])

    // Calculate overall compliance percentage
    const cumplimientoGeneral =
      totalObligaciones > 0
        ? Math.round((obligacionesCumplidas / totalObligaciones) * 100)
        : 0

    return NextResponse.json({
      empresasActivas,
      empresasInactivas,
      obligacionesVencidas,
      obligacionesSemana,
      reportesNominaPendientes,
      cumplimientoGeneral,
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json(
      { error: "Error fetching dashboard stats" },
      { status: 500 }
    )
  }
}
