import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reporte = await prisma.reporteNomina.findUnique({
      where: { id: params.id },
      include: {
        empresa: {
          select: {
            id: true,
            razonSocial: true,
            nit: true,
            nombreComercial: true,
            periodicidadNomina: true,
            tipoNomina: true,
          },
        },
      },
    })

    if (!reporte) {
      return NextResponse.json({ error: "Reporte de nomina not found" }, { status: 404 })
    }

    // Fetch novedades for this reporte's empresa, mes, año, and periodo
    const novedades = await prisma.novedadNomina.findMany({
      where: {
        empresaId: reporte.empresaId,
        mes: reporte.mes,
        año: reporte.año,
        periodo: reporte.periodo,
      },
      include: {
        empleado: {
          select: {
            id: true,
            cedula: true,
            nombre: true,
            ciudad: true,
            activo: true,
          },
        },
      },
      orderBy: [
        { empleado: { nombre: "asc" } },
        { tipoNovedad: "asc" },
      ],
    })

    return NextResponse.json({ ...reporte, novedades })
  } catch (error) {
    console.error("Error fetching reporte de nomina:", error)
    return NextResponse.json({ error: "Error fetching reporte de nomina" }, { status: 500 })
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
    delete data.empresaId // prevent changing parent empresa

    const reporte = await prisma.reporteNomina.update({
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

    return NextResponse.json(reporte)
  } catch (error: any) {
    console.error("Error updating reporte de nomina:", error)
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Reporte de nomina not found" }, { status: 404 })
    }
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "A reporte already exists for this periodo/mes/año combination" },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: "Error updating reporte de nomina" }, { status: 500 })
  }
}
