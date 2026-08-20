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
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

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

  // Validate size from base64 length (approx)
  const approxBytes = Math.ceil((archivoData.length * 3) / 4)
  if (approxBytes > MAX_BYTES) {
    return NextResponse.json({ error: "El archivo supera el límite de 10 MB" }, { status: 400 })
  }

  const userId = (session.user as any)?.id
  const now = new Date()

  const updated = await prisma.obligacionTributaria.update({
    where: { id },
    data: {
      contabilizado: true,
      contabilizadoArchivoNombre: archivoNombre,
      contabilizadoArchivoData: archivoData,
      contabilizadoArchivoTipo: archivoTipo ?? "application/octet-stream",
      contabilizadoFecha: now,
      contabilizadoPorId: userId ?? null,
    },
    include: {
      contabilizadoPor: { select: { id: true, name: true, email: true } },
    },
  })

  // Audit
  if (userId) {
    await prisma.auditoriaObligacion.create({
      data: {
        obligacionId: id,
        accion: "CONTABILIZADO",
        archivoNombre,
        detalles: `Archivo adjunto: ${archivoNombre}`,
        realizadoPorId: userId,
        fechaAccion: now,
      },
    }).catch(() => {})
  }

  return NextResponse.json({
    id: updated.id,
    contabilizado: updated.contabilizado,
    contabilizadoArchivoNombre: updated.contabilizadoArchivoNombre,
    contabilizadoFecha: updated.contabilizadoFecha,
    contabilizadoPor: updated.contabilizadoPor,
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
      contabilizado: false,
      contabilizadoArchivoNombre: null,
      contabilizadoArchivoData: null,
      contabilizadoArchivoTipo: null,
      contabilizadoFecha: null,
      contabilizadoPorId: null,
    },
  })

  if (userId) {
    await prisma.auditoriaObligacion.create({
      data: {
        obligacionId: id,
        accion: "CONTABILIZADO_REMOVIDO",
        archivoNombre: obligacion.contabilizadoArchivoNombre ?? undefined,
        detalles: "Se removió la marca de contabilizado y el archivo adjunto",
        realizadoPorId: userId,
        fechaAccion: now,
      },
    }).catch(() => {})
  }

  return NextResponse.json({
    id: updated.id,
    contabilizado: false,
    contabilizadoArchivoNombre: null,
    contabilizadoFecha: null,
    contabilizadoPor: null,
  })
}
