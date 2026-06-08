import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getNominaSession, canAccess, unauthorized, forbidden } from "@/lib/nomina-auth"

export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest, context: { params: Promise<{ reporteId: string }> }) {
  const session = await getNominaSession()
  if (!session) return unauthorized()

  const { reporteId } = await context.params
  const reporte = await prisma.reporteNomina.findUnique({ where: { id: reporteId } })
  if (!reporte) return NextResponse.json({ error: "Reporte no encontrado" }, { status: 404 })
  if (!canAccess(session, reporte.empresaId)) return forbidden()

  const auditorias = await prisma.auditoriaReporte.findMany({
    where: { reporteNominaId: reporteId },
    orderBy: { fechaAccion: "desc" },
    include: { realizadoPor: { select: { id: true, name: true, email: true } } },
  })

  return NextResponse.json({ auditorias })
}
