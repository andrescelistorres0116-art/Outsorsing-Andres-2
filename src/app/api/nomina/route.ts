import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const empresaId = searchParams.get("empresaId") || undefined
    const estado = searchParams.get("estado") || undefined
    const mes = searchParams.get("mes") ? parseInt(searchParams.get("mes")!) : undefined
    const año = searchParams.get("año") ? parseInt(searchParams.get("año")!) : undefined
    const periodo = searchParams.get("periodo") || undefined
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    const where: any = {
      ...(empresaId ? { empresaId } : {}),
      ...(estado ? { estado: estado as any } : {}),
      ...(mes !== undefined ? { mes } : {}),
      ...(año !== undefined ? { año } : {}),
      ...(periodo ? { periodo: periodo as any } : {}),
    }

    const [reportes, total] = await Promise.all([
      prisma.reporteNomina.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ año: "desc" }, { mes: "desc" }],
        include: {
          empresa: {
            select: {
              id: true,
              razonSocial: true,
              nit: true,
              nombreComercial: true,
            },
          },
        },
      }),
      prisma.reporteNomina.count({ where }),
    ])

    return NextResponse.json({ reportes, total, page, limit })
  } catch (error) {
    console.error("Error fetching reportes de nomina:", error)
    return NextResponse.json({ error: "Error fetching reportes de nomina" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    if (!data.empresaId || !data.periodo || data.mes === undefined || data.año === undefined) {
      return NextResponse.json(
        { error: "empresaId, periodo, mes, and año are required" },
        { status: 400 }
      )
    }

    const reporte = await prisma.reporteNomina.create({
      data,
      include: {
        empresa: {
          select: {
            id: true,
            razonSocial: true,
            nit: true,
          },
        },
      },
    })

    return NextResponse.json(reporte, { status: 201 })
  } catch (error: any) {
    console.error("Error creating reporte de nomina:", error)
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "A reporte already exists for this empresa, periodo, mes, and año" },
        { status: 409 }
      )
    }
    if (error?.code === "P2003") {
      return NextResponse.json(
        { error: "Referenced empresa does not exist" },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: "Error creating reporte de nomina" }, { status: 500 })
  }
}
