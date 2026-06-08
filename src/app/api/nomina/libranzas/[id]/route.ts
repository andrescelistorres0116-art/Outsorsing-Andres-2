import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getNominaSession, canAccess, isContador, isAdmin, unauthorized, forbidden } from "@/lib/nomina-auth"

export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getNominaSession()
  if (!session) return unauthorized()

  const { id } = await context.params
  const libranza = await prisma.libranza.findUnique({
    where: { id },
    include: {
      empleado: { select: { id: true, nombre: true, numeroDocumento: true } },
      novedades: { orderBy: { createdAt: "asc" }, select: { id: true, mes: true, año: true, cuotaNumero: true, valorCuota: true } },
    },
  })
  if (!libranza) return NextResponse.json({ error: "Libranza no encontrada" }, { status: 404 })
  if (!canAccess(session, libranza.empresaId)) return forbidden()

  return NextResponse.json({
    ...libranza,
    valorCuota: libranza.valorCuota.toString(),
    cuotasPagadas: libranza.cuotaActual - 1,
    cuotasPendientes: libranza.numeroCuotas - libranza.cuotaActual + 1,
    novedades: libranza.novedades.map(n => ({ ...n, valorCuota: n.valorCuota?.toString() ?? null })),
  })
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getNominaSession()
  if (!session) return unauthorized()
  if (!isContador(session)) return forbidden()

  const { id } = await context.params
  const existing = await prisma.libranza.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Libranza no encontrada" }, { status: 404 })
  if (!canAccess(session, existing.empresaId)) return forbidden()

  const body = await request.json()
  const cuotasPagadas = existing.cuotaActual - 1

  const updateData: any = {}
  if (body.observaciones !== undefined) updateData.observaciones = body.observaciones?.trim() || null
  if (body.entidad !== undefined) updateData.entidad = body.entidad.trim()
  if (body.numeroPrestamo !== undefined) updateData.numeroPrestamo = body.numeroPrestamo?.trim() || null

  if (body.valorCuota !== undefined || body.numeroCuotas !== undefined) {
    if (cuotasPagadas > 0) {
      return NextResponse.json({ error: "No se puede modificar valorCuota ni numeroCuotas cuando ya hay cuotas pagadas" }, { status: 409 })
    }
    if (body.valorCuota !== undefined) {
      if (Number(body.valorCuota) <= 0) return NextResponse.json({ error: "valorCuota debe ser mayor que cero" }, { status: 400 })
      updateData.valorCuota = body.valorCuota
    }
    if (body.numeroCuotas !== undefined) {
      if (Number(body.numeroCuotas) < 1) return NextResponse.json({ error: "numeroCuotas debe ser al menos 1" }, { status: 400 })
      updateData.numeroCuotas = parseInt(body.numeroCuotas)
    }
  }

  const updated = await prisma.libranza.update({ where: { id }, data: updateData })
  return NextResponse.json({ ...updated, valorCuota: updated.valorCuota.toString() })
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getNominaSession()
  if (!session) return unauthorized()
  if (!isAdmin(session)) return forbidden("Solo administradores pueden eliminar libranzas")

  const { id } = await context.params
  const existing = await prisma.libranza.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Libranza no encontrada" }, { status: 404 })
  if (!canAccess(session, existing.empresaId)) return forbidden()

  if (existing.cuotaActual > 1) {
    return NextResponse.json({ error: "No se puede eliminar una libranza con cuotas pagadas. Solo se puede desactivar." }, { status: 409 })
  }

  await prisma.libranza.delete({ where: { id } })
  return NextResponse.json({ message: "Libranza eliminada" })
}
