import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const estado = searchParams.get("estado") || undefined
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    const where = {
      ...(search
        ? {
            OR: [
              { razonSocial: { contains: search, mode: "insensitive" as const } },
              { nit: { contains: search, mode: "insensitive" as const } },
              { nombreComercial: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(estado ? { estado: estado as any } : {}),
    }

    const [empresas, total] = await Promise.all([
      prisma.empresa.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { razonSocial: "asc" },
      }),
      prisma.empresa.count({ where }),
    ])

    return NextResponse.json({ empresas, total, page, limit })
  } catch (error) {
    console.error("Error fetching empresas:", error)
    return NextResponse.json({ error: "Error fetching empresas" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Validate required fields
    if (!data.razonSocial || !data.nit) {
      return NextResponse.json(
        { error: "razonSocial and nit are required" },
        { status: 400 }
      )
    }

    // dv is required by schema — default to "0" if not provided
    if (!data.dv) {
      data.dv = "0"
    }

    const empresa = await prisma.empresa.create({ data })
    return NextResponse.json(empresa, { status: 201 })
  } catch (error: any) {
    console.error("Error creating empresa:", error)
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "A company with that NIT already exists" },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: "Error creating empresa" }, { status: 500 })
  }
}
