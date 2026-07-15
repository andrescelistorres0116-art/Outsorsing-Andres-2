import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

type Params = Promise<{ id: string }>

// POST — marcar como "No Aplica" (sin adjuntar documentos)
export async function POST(_req: NextRequest, context: { params: Params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await context.params

  const existing = await prisma.obligacionTributaria.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

  const updated = await prisma.obligacionTributaria.update({
    where: { id },
    data: { noAplica: true, noAplicaFecha: new Date() },
    select: { id: true, noAplica: true, noAplicaFecha: true },
  })

  prisma.auditoriaObligacion.create({
    data: {
      obligacionId: id,
      accion: "NO_APLICA",
      usuarioId: (session.user as any).id,
      detalle: "Marcada como No Aplica (sin movimientos o sin obligación vigente)",
    },
  }).catch(() => {})

  return NextResponse.json(updated)
}

// DELETE — revertir "No Aplica"
export async function DELETE(_req: NextRequest, context: { params: Params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await context.params

  const existing = await prisma.obligacionTributaria.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

  const updated = await prisma.obligacionTributaria.update({
    where: { id },
    data: { noAplica: false, noAplicaFecha: null },
    select: { id: true, noAplica: true, noAplicaFecha: true },
  })

  prisma.auditoriaObligacion.create({
    data: {
      obligacionId: id,
      accion: "NO_APLICA_REMOVIDO",
      usuarioId: (session.user as any).id,
      detalle: "No Aplica revertido",
    },
  }).catch(() => {})

  return NextResponse.json(updated)
}
