import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { EstadoReporteNomina, TipoNovedad } from "@prisma/client"
import { getNominaSession, canAccess, unauthorized, forbidden } from "@/lib/nomina-auth"

export const dynamic = "force-dynamic"

const ESTADOS_EDITABLES: EstadoReporteNomina[] = [EstadoReporteNomina.BORRADOR, EstadoReporteNomina.REABIERTA, EstadoReporteNomina.CORREGIDA]

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getNominaSession()
  if (!session) return unauthorized()

  const { id } = await context.params
  const novedad = await prisma.novedadNomina.findUnique({
    where: { id },
    include: {
      empleado: { select: { id: true, numeroDocumento: true, nombre: true } },
      empresa: { select: { id: true, razonSocial: true } },
      creadoPor: { select: { id: true, name: true } },
      libranza: true,
    },
  })
  if (!novedad) return NextResponse.json({ error: "Novedad no encontrada" }, { status: 404 })
  if (!canAccess(session, novedad.empresaId)) return forbidden()

  return NextResponse.json({
    ...novedad,
    valor: novedad.valor?.toString() ?? null,
    tarifaHora: novedad.tarifaHora?.toString() ?? null,
    porcentaje: novedad.porcentaje?.toString() ?? null,
    horas: novedad.horas?.toString() ?? null,
    valorCuota: novedad.valorCuota?.toString() ?? null,
    libranza: novedad.libranza ? { ...novedad.libranza, valorCuota: novedad.libranza.valorCuota.toString() } : null,
  })
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getNominaSession()
  if (!session) return unauthorized()

  const { id } = await context.params
  const existing = await prisma.novedadNomina.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Novedad no encontrada" }, { status: 404 })
  if (!canAccess(session, existing.empresaId)) return forbidden()

  // Clients can only edit their own novedades
  if (session.role === "CLIENT" && existing.creadoPorId !== session.userId) {
    return forbidden("Solo puedes modificar novedades que tú creaste")
  }

  // Check reporte state
  if (existing.reporteId) {
    const reporte = await prisma.reporteNomina.findUnique({ where: { id: existing.reporteId } })
    if (reporte && !ESTADOS_EDITABLES.includes(reporte.estado)) {
      return NextResponse.json({ error: `No se puede modificar una novedad en reporte con estado ${reporte.estado}` }, { status: 409 })
    }
  }

  const body = await request.json()
  // Don't allow changing tipo, empresa, or empleado
  delete body.tipoNovedad
  delete body.empresaId
  delete body.empleadoId
  delete body.id

  const updateData: any = {}
  if (body.valor !== undefined) updateData.valor = body.valor != null ? body.valor : null
  if (body.horas !== undefined) updateData.horas = body.horas != null ? body.horas : null
  if (body.tarifaHora !== undefined) updateData.tarifaHora = body.tarifaHora != null ? body.tarifaHora : null
  if (body.porcentaje !== undefined) updateData.porcentaje = body.porcentaje != null ? body.porcentaje : null
  if (body.diasAusencia !== undefined) updateData.diasAusencia = body.diasAusencia != null ? Number(body.diasAusencia) : null
  if (body.valorCuota !== undefined) updateData.valorCuota = body.valorCuota != null ? Number(body.valorCuota) : null
  if (body.cuotaNumero !== undefined) updateData.cuotaNumero = body.cuotaNumero != null ? parseInt(body.cuotaNumero) : null
  if (body.numeroCuotas !== undefined) updateData.numeroCuotas = body.numeroCuotas != null ? parseInt(body.numeroCuotas) : null
  if (body.descripcion !== undefined) updateData.descripcion = body.descripcion?.trim() || null
  if (body.adjunto !== undefined) updateData.adjunto = body.adjunto?.trim() || null
  if (body.fechaInicioNovedad !== undefined) updateData.fechaInicioNovedad = body.fechaInicioNovedad ? new Date(body.fechaInicioNovedad) : null
  if (body.fechaFinNovedad !== undefined) updateData.fechaFinNovedad = body.fechaFinNovedad ? new Date(body.fechaFinNovedad) : null

  const updated = await prisma.novedadNomina.update({ where: { id }, data: updateData })

  // Sync RETIRO date change to employee record
  if (existing.tipoNovedad === TipoNovedad.RETIRO && body.fechaFinNovedad) {
    await prisma.empleado.update({
      where: { id: existing.empleadoId },
      data: { fechaRetiro: new Date(body.fechaFinNovedad) },
    })
  }

  await prisma.auditoriaNovedad.create({
    data: {
      novedadNominaId: id,
      accion: "ACTUALIZADO",
      camposAntes: { valor: existing.valor?.toString() ?? null, horas: existing.horas?.toString() ?? null, descripcion: existing.descripcion },
      camposDespues: { valor: updated.valor?.toString() ?? null, horas: updated.horas?.toString() ?? null, descripcion: updated.descripcion },
      realizadoPorId: session.userId,
    },
  })

  return NextResponse.json({
    ...updated,
    valor: updated.valor?.toString() ?? null,
    tarifaHora: updated.tarifaHora?.toString() ?? null,
    porcentaje: updated.porcentaje?.toString() ?? null,
    horas: updated.horas?.toString() ?? null,
    valorCuota: updated.valorCuota?.toString() ?? null,
  })
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getNominaSession()
  if (!session) return unauthorized()

  const { id } = await context.params
  const existing = await prisma.novedadNomina.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Novedad no encontrada" }, { status: 404 })
  if (!canAccess(session, existing.empresaId)) return forbidden()

  if (existing.reporteId) {
    const reporte = await prisma.reporteNomina.findUnique({ where: { id: existing.reporteId } })
    if (reporte && !ESTADOS_EDITABLES.includes(reporte.estado)) {
      return NextResponse.json({ error: `No se puede eliminar una novedad en reporte con estado ${reporte.estado}` }, { status: 409 })
    }
  }

  // Reverse RETIRO: reactivate employee
  if (existing.tipoNovedad === TipoNovedad.RETIRO) {
    await prisma.empleado.update({
      where: { id: existing.empleadoId },
      data: { activo: true, fechaRetiro: null },
    })
  }

  // Reverse LIBRANZA: roll back cuota advancement
  if (existing.tipoNovedad === TipoNovedad.LIBRANZA && existing.libranzaId) {
    const libranza = await prisma.libranza.findUnique({ where: { id: existing.libranzaId } })
    if (libranza && libranza.cuotaActual > 1) {
      await prisma.libranza.update({
        where: { id: existing.libranzaId },
        data: { cuotaActual: libranza.cuotaActual - 1, activa: true },
      })
    }
  }

  await prisma.novedadNomina.delete({ where: { id } })
  return NextResponse.json({ message: "Novedad eliminada" })
}
