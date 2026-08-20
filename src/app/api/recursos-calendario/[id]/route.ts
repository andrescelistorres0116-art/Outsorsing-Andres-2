import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

type Params = Promise<{ id: string }>

// GET — serve file; ?view=1 renders inline (PDF viewer), default forces download
export async function GET(req: NextRequest, context: { params: Params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await context.params
  const inline = new URL(req.url).searchParams.get("view") === "1"

  const recurso = await prisma.recursoCalendario.findUnique({ where: { id } })
  if (!recurso) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  const disposition = inline
    ? "inline"
    : `attachment; filename="${encodeURIComponent(recurso.nombre)}"`

  return new NextResponse(recurso.datos, {
    headers: {
      "Content-Type":        recurso.tipo,
      "Content-Disposition": disposition,
      "Content-Length":      String(recurso.tamanio),
    },
  })
}
