import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getNominaSession, canAccess, isContador, unauthorized, forbidden } from "@/lib/nomina-auth"
import { EstadoReporteNomina, PeriodicidadNomina, PeriodoNomina } from "@prisma/client"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const session = await getNominaSession()
  if (!session) return unauthorized()

  const { searchParams } = new URL(request.url)
  const empresaId = searchParams.get("empresaId") || undefined
  const estado = searchParams.get("estado") as EstadoReporteNomina | null
  const mes = searchParams.get("mes") ? parseInt(searchParams.get("mes")!) : undefined
  const año = searchParams.get("año") ? parseInt(searchParams.get("año")!) : undefined
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
  const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"))

  const where: any = {}
  if (empresaId) {
    if (!canAccess(session, empresaId)) return forbidden()
    where.empresaId = empresaId
  } else if (session.role !== "ADMIN") {
    // Non-admins without specific empresaId get only their companies
    where.empresaId = { in: session.empresaIds }
  }
  if (estado) where.estado = estado
  if (mes !== undefined) where.mes = mes
  if (año !== undefined) where.año = año

  const [reportes, total] = await Promise.all([
    prisma.reporteNomina.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ año: "desc" }, { mes: "desc" }, { createdAt: "desc" }],
      include: {
        empresa: { select: { id: true, razonSocial: true, nit: true, nombreComercial: true } },
        enviadoPor: { select: { id: true, name: true } },
        aprobadoPor: { select: { id: true, name: true } },
      },
    }),
    prisma.reporteNomina.count({ where }),
  ])

  return NextResponse.json({ reportes, total, page, limit })
}

export async function POST(request: NextRequest) {
  const session = await getNominaSession()
  if (!session) return unauthorized()

  const body = await request.json()
  const { empresaId, periodo, mes, año, sinNovedades, comentarios, fechaInicioPeriodo, fechaFinPeriodo } = body

  const errors: string[] = []
  if (!empresaId) errors.push("empresaId es requerido")
  if (!periodo) errors.push("periodo es requerido")
  if (mes === undefined || mes === null || mes < 1 || mes > 12) errors.push("mes debe ser entre 1 y 12")
  if (año === undefined || año === null || año < 2020 || año > 2035) errors.push("año debe ser entre 2020 y 2035")
  if (errors.length) return NextResponse.json({ error: "Validación fallida", details: errors }, { status: 400 })

  if (!canAccess(session, empresaId)) return forbidden()

  const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } })
  if (!empresa) return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })

  // Validate periodo vs empresa periodicidad
  const periodoErrors: string[] = []
  if (empresa.periodicidadNomina === PeriodicidadNomina.MENSUAL && periodo !== PeriodoNomina.MENSUAL) {
    periodoErrors.push("Esta empresa tiene nómina MENSUAL; el periodo debe ser MENSUAL")
  }
  if (empresa.periodicidadNomina === PeriodicidadNomina.QUINCENAL && periodo === PeriodoNomina.MENSUAL) {
    periodoErrors.push("Esta empresa tiene nómina QUINCENAL; el periodo debe ser PRIMERA_QUINCENA o SEGUNDA_QUINCENA")
  }
  if (periodoErrors.length) return NextResponse.json({ error: "Validación fallida", details: periodoErrors }, { status: 400 })

  try {
    const reporte = await prisma.reporteNomina.create({
      data: {
        empresaId,
        periodo: periodo as PeriodoNomina,
        mes: parseInt(mes),
        año: parseInt(año),
        estado: EstadoReporteNomina.BORRADOR,
        sinNovedades: sinNovedades ?? false,
        comentarios: comentarios?.trim() || null,
        fechaInicioPeriodo: fechaInicioPeriodo ? new Date(fechaInicioPeriodo) : null,
        fechaFinPeriodo: fechaFinPeriodo ? new Date(fechaFinPeriodo) : null,
      },
      include: {
        empresa: { select: { id: true, razonSocial: true, nit: true } },
      },
    })

    await prisma.auditoriaReporte.create({
      data: {
        reporteNominaId: reporte.id,
        accion: "CREADO",
        estadoAntes: null,
        estadoDespues: EstadoReporteNomina.BORRADOR,
        realizadoPorId: session.userId,
      },
    })

    return NextResponse.json(reporte, { status: 201 })
  } catch (error: any) {
    if (error?.code === "P2002") return NextResponse.json({ error: "Ya existe un reporte para esta empresa, periodo, mes y año" }, { status: 409 })
    console.error(error)
    return NextResponse.json({ error: "Error al crear reporte" }, { status: 500 })
  }
}
