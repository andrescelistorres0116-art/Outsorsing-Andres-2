import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const RESPONSABLE_SELECT = { select: { id: true, name: true, email: true } }

const INCLUDE = {
  empresa: { select: { id: true, razonSocial: true, nit: true, nombreComercial: true } },
  responsable: RESPONSABLE_SELECT,
  contabilizadoPor: RESPONSABLE_SELECT,
  declaradoPor: RESPONSABLE_SELECT,
  pagadoPor: RESPONSABLE_SELECT,
}

function strip(row: any) {
  const { contabilizadoArchivoData, declaradoArchivoData, ...safe } = row
  return safe
}

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  try {
    const { id } = await context.params
    const obligacion = await prisma.obligacionTributaria.findUnique({
      where: { id },
      include: INCLUDE,
    })
    if (!obligacion) return NextResponse.json({ error: "Obligacion not found" }, { status: 404 })
    return NextResponse.json(strip(obligacion))
  } catch {
    return NextResponse.json({ error: "Error fetching obligacion" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  try {
    const { id } = await context.params
    const body = await request.json()

    // Only allow known scalar fields — never update file data via PUT
    const allowed: (keyof typeof body)[] = [
      "tipoObligacion", "periodicidad", "periodo", "año", "fechaVencimiento",
      "estado", "municipio", "observaciones", "responsableNombre", "responsableId",
      "contabilizado", "declarado", "pagado",
    ]

    const data: any = {}
    for (const key of allowed) {
      if (body[key] !== undefined) {
        if (key === "fechaVencimiento" && body[key]) {
          data[key] = new Date(body[key])
        } else if (key === "periodo") {
          data[key] = body[key] !== null ? String(body[key]) : null
        } else {
          data[key] = body[key]
        }
      }
    }

    const obligacion = await prisma.obligacionTributaria.update({
      where: { id },
      data,
      include: INCLUDE,
    })
    return NextResponse.json(strip(obligacion))
  } catch (error: any) {
    if (error?.code === "P2025") return NextResponse.json({ error: "Obligacion not found" }, { status: 404 })
    return NextResponse.json({ error: "Error updating obligacion" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  try {
    const { id } = await context.params
    await prisma.obligacionTributaria.delete({ where: { id } })
    return NextResponse.json({ message: "Obligacion eliminada" })
  } catch (error: any) {
    if (error?.code === "P2025") return NextResponse.json({ error: "Obligacion not found" }, { status: 404 })
    return NextResponse.json({ error: "Error deleting obligacion" }, { status: 500 })
  }
}
