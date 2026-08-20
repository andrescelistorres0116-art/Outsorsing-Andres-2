import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getNominaSession, canAccess, isContador, unauthorized, forbidden } from "@/lib/nomina-auth"
import { EstadoReporteNomina, UserRole } from "@prisma/client"
import { generarNovedadesLibranzaParaReporte } from "@/lib/generar-nominas"

export const dynamic = "force-dynamic"

const ESTADOS_EDITABLES: EstadoReporteNomina[] = [EstadoReporteNomina.BORRADOR, EstadoReporteNomina.REABIERTA, EstadoReporteNomina.CORREGIDA]

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getNominaSession()
  if (!session) return unauthorized()

  const { id } = await context.params
  const reporte = await prisma.reporteNomina.findUnique({
    where: { id },
    include: {
      empresa: { select: { id: true, razonSocial: true, nit: true, nombreComercial: true, periodicidadNomina: true, modoFlujoNomina: true } },
      enviadoPor: { select: { id: true, name: true, email: true } },
      revisadoPor: { select: { id: true, name: true, email: true } },
      aprobadoPor: { select: { id: true, name: true, email: true } },
      cerradoPor: { select: { id: true, name: true, email: true } },
      novedades: {
        include: {
          empleado: { select: { id: true, numeroDocumento: true, nombre: true, activo: true } },
          creadoPor: { select: { id: true, name: true } },
        },
        orderBy: [{ empleado: { nombre: "asc" } }, { tipoNovedad: "asc" }],
      },
    },
  })
  if (!reporte) return NextResponse.json({ error: "Reporte no encontrado" }, { status: 404 })
  if (!canAccess(session, reporte.empresaId)) return forbidden()

  // Lazy trigger: auto-generate libranza novedades the first time an editable report is opened
  if (ESTADOS_EDITABLES.includes(reporte.estado) && reporte.fechaInicioPeriodo && reporte.fechaFinPeriodo) {
    const adminUser = await prisma.user.findFirst({ where: { role: UserRole.ADMIN }, select: { id: true } })
    if (adminUser) {
      generarNovedadesLibranzaParaReporte(
        reporte.id, reporte.empresaId, reporte.mes, reporte.año, reporte.periodo,
        reporte.fechaInicioPeriodo, reporte.fechaFinPeriodo, adminUser.id,
      ).catch(e => console.error("[generar-libranzas] lazy trigger error:", e?.message))
    }
  }

  const serializeNovedad = (n: any) => ({
    ...n,
    valor: n.valor?.toString() ?? null,
    tarifaHora: n.tarifaHora?.toString() ?? null,
    porcentaje: n.porcentaje?.toString() ?? null,
    horas: n.horas?.toString() ?? null,
    valorCuota: n.valorCuota?.toString() ?? null,
  })

  return NextResponse.json({ ...reporte, novedades: reporte.novedades.map(serializeNovedad) })
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getNominaSession()
  if (!session) return unauthorized()
  if (!isContador(session)) return forbidden("Solo contadores y administradores pueden modificar reportes")

  const { id } = await context.params
  const reporte = await prisma.reporteNomina.findUnique({ where: { id } })
  if (!reporte) return NextResponse.json({ error: "Reporte no encontrado" }, { status: 404 })
  if (!canAccess(session, reporte.empresaId)) return forbidden()

  if (!ESTADOS_EDITABLES.includes(reporte.estado)) {
    return NextResponse.json({ error: `No se puede modificar un reporte en estado ${reporte.estado}` }, { status: 409 })
  }

  const body = await request.json()
  const { comentarios, sinNovedades, fechaInicioPeriodo, fechaFinPeriodo } = body

  const updateData: any = {}
  if (comentarios !== undefined) updateData.comentarios = comentarios?.trim() || null
  if (sinNovedades !== undefined) updateData.sinNovedades = sinNovedades

  if (fechaInicioPeriodo !== undefined) updateData.fechaInicioPeriodo = fechaInicioPeriodo ? new Date(fechaInicioPeriodo) : null
  if (fechaFinPeriodo !== undefined) {
    if (fechaInicioPeriodo && fechaFinPeriodo && new Date(fechaFinPeriodo) <= new Date(fechaInicioPeriodo)) {
      return NextResponse.json({ error: "fechaFinPeriodo debe ser posterior a fechaInicioPeriodo" }, { status: 400 })
    }
    updateData.fechaFinPeriodo = fechaFinPeriodo ? new Date(fechaFinPeriodo) : null
  }

  const updated = await prisma.reporteNomina.update({ where: { id }, data: updateData })
  return NextResponse.json(updated)
}
