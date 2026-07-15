import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

type Params = Promise<{ id: string }>

// GET — download file by id
export async function GET(_req: NextRequest, context: { params: Params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await context.params

  const recurso = await prisma.recursoCalendario.findUnique({ where: { id } })
  if (!recurso) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  return new NextResponse(recurso.datos, {
    headers: {
      "Content-Type": recurso.tipo,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(recurso.nombre)}"`,
      "Content-Length": String(recurso.tamanio),
    },
  })
}
