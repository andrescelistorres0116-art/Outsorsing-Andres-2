import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const obligacion = await prisma.obligacionTributaria.findUnique({
      where: { id },
      include: {
        empresa: { select: { id: true, razonSocial: true, nit: true, nombreComercial: true, correo: true } },
        responsable: { select: { id: true, name: true, email: true, role: true } },
      },
    })
    if (!obligacion) return NextResponse.json({ error: "Obligacion not found" }, { status: 404 })
    return NextResponse.json(obligacion)
  } catch {
    return NextResponse.json({ error: "Error fetching obligacion" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const data = await request.json()
    delete data.id
    delete data.createdAt
    delete data.empresaId
    if (data.fechaVencimiento) data.fechaVencimiento = new Date(data.fechaVencimiento)
    const obligacion = await prisma.obligacionTributaria.update({
      where: { id },
      data,
      include: { empresa: { select: { id: true, razonSocial: true, nit: true } } },
    })
    return NextResponse.json(obligacion)
  } catch (error: any) {
    if (error?.code === "P2025") return NextResponse.json({ error: "Obligacion not found" }, { status: 404 })
    return NextResponse.json({ error: "Error updating obligacion" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    await prisma.obligacionTributaria.delete({ where: { id } })
    return NextResponse.json({ message: "Obligacion deleted" })
  } catch (error: any) {
    if (error?.code === "P2025") return NextResponse.json({ error: "Obligacion not found" }, { status: 404 })
    return NextResponse.json({ error: "Error deleting obligacion" }, { status: 500 })
  }
}
