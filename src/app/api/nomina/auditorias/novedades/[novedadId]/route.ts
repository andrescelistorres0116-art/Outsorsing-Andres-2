import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getNominaSession, canAccess, unauthorized, forbidden } from "@/lib/nomina-auth"

export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest, context: { params: Promise<{ novedadId: string }> }) {
  const session = await getNominaSession()
  if (!session) return unauthorized()

  const { novedadId } = await context.params
  const novedad = await prisma.novedadNomina.findUnique({ where: { id: novedadId } })
  if (!novedad) return NextResponse.json({ error: "Novedad no encontrada" }, { status: 404 })
  if (!canAccess(session, novedad.empresaId)) return forbidden()

  const auditorias = await prisma.auditoriaNovedad.findMany({
    where: { novedadNominaId: novedadId },
    orderBy: { fechaAccion: "desc" },
    include: { realizadoPor: { select: { id: true, name: true, email: true } } },
  })

  return NextResponse.json({ auditorias })
}
