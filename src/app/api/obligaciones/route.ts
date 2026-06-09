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
  // Never return base64 file data in list responses
  const { contabilizadoArchivoData, declaradoArchivoData, ...safe } = row
  return safe
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const empresaId = searchParams.get("empresaId") || undefined
    const estado = searchParams.get("estado") || undefined
    const mes = searchParams.get("mes") ? parseInt(searchParams.get("mes")!) : undefined
    const año = searchParams.get("año") ? parseInt(searchParams.get("año")!) : undefined
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(parseInt(searchParams.get("limit") || "200"), 500)

    const where: any = {
      ...(empresaId ? { empresaId } : {}),
      ...(estado ? { estado: estado as any } : {}),
      ...(año ? { año } : {}),
    }

    if (mes !== undefined) {
      const year = año ?? new Date().getFullYear()
      where.fechaVencimiento = {
        gte: new Date(year, mes - 1, 1),
        lte: new Date(year, mes, 0, 23, 59, 59, 999),
      }
    }

    const [obligaciones, total] = await Promise.all([
      prisma.obligacionTributaria.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { fechaVencimiento: "asc" },
        include: INCLUDE,
      }),
      prisma.obligacionTributaria.count({ where }),
    ])

    return NextResponse.json({ obligaciones: obligaciones.map(strip), total, page, limit })
  } catch (error) {
    console.error("Error fetching obligaciones:", error)
    return NextResponse.json({ error: "Error fetching obligaciones" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  try {
    const body = await request.json()

    if (!body.empresaId || !body.tipoObligacion || !body.periodicidad || !body.año || !body.fechaVencimiento) {
      return NextResponse.json(
        { error: "empresaId, tipoObligacion, periodicidad, año y fechaVencimiento son requeridos" },
        { status: 400 }
      )
    }

    const { contabilizadoArchivoData, declaradoArchivoData, ...safe } = body

    const obligacion = await prisma.obligacionTributaria.create({
      data: {
        empresaId: safe.empresaId,
        tipoObligacion: safe.tipoObligacion,
        periodicidad: safe.periodicidad,
        periodo: safe.periodo ? String(safe.periodo) : null,
        año: Number(safe.año),
        fechaVencimiento: new Date(safe.fechaVencimiento),
        estado: safe.estado ?? "PENDIENTE",
        municipio: safe.municipio ?? null,
        observaciones: safe.observaciones ?? null,
        responsableNombre: safe.responsableNombre ?? safe.responsable ?? null,
        responsableId: safe.responsableId ?? null,
      },
      include: INCLUDE,
    })

    return NextResponse.json(strip(obligacion), { status: 201 })
  } catch (error: any) {
    console.error("Error creating obligacion:", error)
    if (error?.code === "P2003") {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 400 })
    }
    return NextResponse.json({ error: "Error creating obligacion" }, { status: 500 })
  }
}
