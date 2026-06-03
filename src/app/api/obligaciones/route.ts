import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const empresaId = searchParams.get("empresaId") || undefined
    const estado = searchParams.get("estado") || undefined
    const mes = searchParams.get("mes") ? parseInt(searchParams.get("mes")!) : undefined
    const año = searchParams.get("año") ? parseInt(searchParams.get("año")!) : undefined
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    const where: any = {
      ...(empresaId ? { empresaId } : {}),
      ...(estado ? { estado: estado as any } : {}),
      ...(año ? { año } : {}),
    }

    // Filter by month using fechaVencimiento when mes is provided
    if (mes !== undefined) {
      const year = año ?? new Date().getFullYear()
      const startOfMonth = new Date(year, mes - 1, 1)
      const endOfMonth = new Date(year, mes, 0, 23, 59, 59, 999)
      where.fechaVencimiento = {
        gte: startOfMonth,
        lte: endOfMonth,
      }
    }

    const [obligaciones, total] = await Promise.all([
      prisma.obligacionTributaria.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { fechaVencimiento: "asc" },
        include: {
          empresa: {
            select: {
              id: true,
              razonSocial: true,
              nit: true,
              nombreComercial: true,
            },
          },
          responsable: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.obligacionTributaria.count({ where }),
    ])

    return NextResponse.json({ obligaciones, total, page, limit })
  } catch (error) {
    console.error("Error fetching obligaciones:", error)
    return NextResponse.json({ error: "Error fetching obligaciones" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Validate required fields
    if (!data.empresaId || !data.tipoObligacion || !data.periodicidad || !data.año || !data.fechaVencimiento) {
      return NextResponse.json(
        { error: "empresaId, tipoObligacion, periodicidad, año, and fechaVencimiento are required" },
        { status: 400 }
      )
    }

    const obligacion = await prisma.obligacionTributaria.create({
      data: {
        ...data,
        fechaVencimiento: new Date(data.fechaVencimiento),
      },
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

    return NextResponse.json(obligacion, { status: 201 })
  } catch (error: any) {
    console.error("Error creating obligacion:", error)
    if (error?.code === "P2003") {
      return NextResponse.json(
        { error: "Referenced empresa or user does not exist" },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: "Error creating obligacion" }, { status: 500 })
  }
}
