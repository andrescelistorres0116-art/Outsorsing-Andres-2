import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await context.params

  const auditorias = await prisma.auditoriaObligacion.findMany({
    where: { obligacionId: id },
    orderBy: { fechaAccion: "desc" },
    include: {
      realizadoPor: { select: { id: true, name: true, email: true } },
    },
  })

  return NextResponse.json({ auditorias })
}
