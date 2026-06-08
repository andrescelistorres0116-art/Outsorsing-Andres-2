import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getNominaSession, canAccess, unauthorized, forbidden } from "@/lib/nomina-auth"

export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest, context: { params: Promise<{ empleadoId: string }> }) {
  const session = await getNominaSession()
  if (!session) return unauthorized()

  const { empleadoId } = await context.params
  const empleado = await prisma.empleado.findUnique({ where: { id: empleadoId } })
  if (!empleado) return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 })
  if (!canAccess(session, empleado.empresaId)) return forbidden()

  const auditorias = await prisma.auditoriaEmpleado.findMany({
    where: { empleadoId },
    orderBy: { fechaAccion: "desc" },
    include: { realizadoPor: { select: { id: true, name: true, email: true } } },
  })

  return NextResponse.json({ auditorias })
}
