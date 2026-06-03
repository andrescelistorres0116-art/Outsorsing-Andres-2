import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const empresa = await prisma.empresa.findUnique({
      where: { id: params.id },
      include: {
        accesos: {
          select: {
            id: true,
            tipo: true,
            entidad: true,
            usuario: true,
            createdAt: true,
          },
        },
        obligaciones: {
          orderBy: { fechaVencimiento: "asc" },
          take: 10,
        },
        _count: {
          select: {
            empleados: true,
            obligaciones: true,
            accesos: true,
          },
        },
      },
    })

    if (!empresa) {
      return NextResponse.json({ error: "Empresa not found" }, { status: 404 })
    }

    return NextResponse.json(empresa)
  } catch (error) {
    console.error("Error fetching empresa:", error)
    return NextResponse.json({ error: "Error fetching empresa" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()

    // Prevent overwriting id
    delete data.id
    delete data.createdAt

    const empresa = await prisma.empresa.update({
      where: { id: params.id },
      data,
    })

    return NextResponse.json(empresa)
  } catch (error: any) {
    console.error("Error updating empresa:", error)
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Empresa not found" }, { status: 404 })
    }
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "A company with that NIT already exists" },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: "Error updating empresa" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Soft delete — set estado to INACTIVA
    const empresa = await prisma.empresa.update({
      where: { id: params.id },
      data: { estado: "INACTIVA" },
    })

    return NextResponse.json({ message: "Empresa deactivated", empresa })
  } catch (error: any) {
    console.error("Error deactivating empresa:", error)
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Empresa not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Error deactivating empresa" }, { status: 500 })
  }
}
