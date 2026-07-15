import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const MAX_BYTES = 15 * 1024 * 1024 // 15 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]

// GET — list all recursos (no file data, just metadata)
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const recursos = await prisma.recursoCalendario.findMany({
    orderBy: { subidoEn: "desc" },
    select: { id: true, nombre: true, tipo: true, tamanio: true, subidoEn: true },
  })

  return NextResponse.json(recursos)
}

// POST — upload a new resource
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { archivoData, archivoNombre, archivoTipo } = await req.json()

  if (!archivoData || !archivoNombre) {
    return NextResponse.json({ error: "Se requiere archivoData y archivoNombre" }, { status: 400 })
  }

  if (archivoTipo && !ALLOWED_TYPES.includes(archivoTipo)) {
    return NextResponse.json(
      { error: "Tipo no permitido. Use PDF, XLS o XLSX." },
      { status: 400 }
    )
  }

  const buffer = Buffer.from(archivoData, "base64")
  if (buffer.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "El archivo supera el límite de 15 MB" }, { status: 400 })
  }

  const recurso = await prisma.recursoCalendario.create({
    data: {
      nombre: archivoNombre,
      tipo: archivoTipo ?? "application/pdf",
      datos: buffer,
      tamanio: buffer.byteLength,
    },
    select: { id: true, nombre: true, tipo: true, tamanio: true, subidoEn: true },
  })

  return NextResponse.json(recurso, { status: 201 })
}

// DELETE — delete by id (body: { id })
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 })

  await prisma.recursoCalendario.delete({ where: { id } }).catch(() => {})

  return NextResponse.json({ ok: true })
}
