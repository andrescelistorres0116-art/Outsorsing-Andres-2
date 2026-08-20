import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "application/x-zip-compressed",
]
const MAX_BYTES = 10 * 1024 * 1024

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await context.params
  const obligacion = await prisma.obligacionTributaria.findUnique({ where: { id } })
  if (!obligacion) return NextResponse.json({ error: "Obligación no encontrada" }, { status: 404 })

  const body = await request.json()
  const { archivoData, archivoNombre, archivoTipo } = body

  if (!archivoData || !archivoNombre) {
    return NextResponse.json({ error: "Se requiere archivoData y archivoNombre" }, { status: 400 })
  }

  if (archivoTipo && !ALLOWED_TYPES.includes(archivoTipo)) {
    return NextResponse.json(
      { error: "Tipo de archivo no permitido. Use PDF, XLS, XLSX o ZIP." },
      { status: 400 }
    )
  }

  const approxBytes = Math.ceil((archivoData.length * 3) / 4)
  if (approxBytes > MAX_BYTES) {
    return NextResponse.json({ error: "El archivo supera el límite de 10 MB" }, { status: 400 })
  }

  const userId = (session.user as any)?.id
  const now = new Date()

  const updated = await prisma.obligacionTributaria.update({
    where: { id },
    data: {
      declarado: true,
      declaradoArchivoNombre: archivoNombre,
      declaradoArchivoData: archivoData,
      declaradoArchivoTipo: archivoTipo ?? "application/octet-stream",
      declaradoFecha: now,
      declaradoPorId: userId ?? null,
    },
    include: {
      declaradoPor: { select: { id: true, name: true, email: true } },
    },
  })

  if (userId) {
    await prisma.auditoriaObligacion.create({
      data: {
        obligacionId: id,
        accion: "DECLARADO",
        archivoNombre,
        detalles: `Archivo adjunto: ${archivoNombre}`,
        realizadoPorId: userId,
        fechaAccion: now,
      },
    }).catch(() => {})
  }

  return NextResponse.json({
    id: updated.id,
    declarado: updated.declarado,
    declaradoArchivoNombre: updated.declaradoArchivoNombre,
    declaradoFecha: updated.declaradoFecha,
    declaradoPor: updated.declaradoPor,
  })
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await context.params
  const obligacion = await prisma.obligacionTributaria.findUnique({ where: { id } })
  if (!obligacion) return NextResponse.json({ error: "Obligación no encontrada" }, { status: 404 })

  const userId = (session.user as any)?.id
  const now = new Date()

  const updated = await prisma.obligacionTributaria.update({
    where: { id },
    data: {
      declarado: false,
      declaradoArchivoNombre: null,
      declaradoArchivoData: null,
      declaradoArchivoTipo: null,
      declaradoFecha: null,
      declaradoPorId: null,
    },
  })

  if (userId) {
    await prisma.auditoriaObligacion.create({
      data: {
        obligacionId: id,
        accion: "DECLARADO_REMOVIDO",
        archivoNombre: obligacion.declaradoArchivoNombre ?? undefined,
        detalles: "Se removió la marca de declarado y el archivo adjunto",
        realizadoPorId: userId,
        fechaAccion: now,
      },
    }).catch(() => {})
  }

  return NextResponse.json({
    id: updated.id,
    declarado: false,
    declaradoArchivoNombre: null,
    declaradoFecha: null,
    declaradoPor: null,
  })
}
