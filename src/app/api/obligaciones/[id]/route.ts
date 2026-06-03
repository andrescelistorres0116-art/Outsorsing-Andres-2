import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const obligacion = await prisma.obligacionTributaria.findUnique({
      where: { id: params.id },
      include: {
        empresa: {
          select: {
            id: true,
            razonSocial: true,
            nit: true,
            nombreComercial: true,
            correo: true,
          },
        },
        responsable: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    })

    if (!obligacion) {
      return NextResponse.json({ error: "Obligacion not found" }, { status: 404 })
    }

    return NextResponse.json(obligacion)
  } catch (error) {
    console.error("Error fetching obligacion:", error)
    return NextResponse.json({ error: "Error fetching obligacion" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()

    delete data.id
    delete data.createdAt
    delete data.empresaId // prevent changing the parent empresa

    if (data.fechaVencimiento) {
      data.fechaVencimiento = new Date(data.fechaVencimiento)
    }

    const obligacion = await prisma.obligacionTributaria.update({
      where: { id: params.id },
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

    return NextResponse.json(obligacion)
  } catch (error: any) {
    console.error("Error updating obligacion:", error)
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Obligacion not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Error updating obligacion" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.obligacionTributaria.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Obligacion deleted" })
  } catch (error: any) {
    console.error("Error deleting obligacion:", error)
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Obligacion not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Error deleting obligacion" }, { status: 500 })
  }
}
