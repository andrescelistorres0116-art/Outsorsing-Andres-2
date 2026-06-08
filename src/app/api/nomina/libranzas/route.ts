import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getNominaSession, canAccess, isContador, unauthorized, forbidden } from "@/lib/nomina-auth"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const session = await getNominaSession()
  if (!session) return unauthorized()

  const { searchParams } = new URL(request.url)
  const empresaId = searchParams.get("empresaId")
  const empleadoId = searchParams.get("empleadoId") || undefined
  const activa = searchParams.get("activa")

  if (!empresaId) return NextResponse.json({ error: "empresaId es requerido" }, { status: 400 })
  if (!canAccess(session, empresaId)) return forbidden()

  const where: any = { empresaId }
  if (empleadoId) where.empleadoId = empleadoId
  if (activa !== null) where.activa = activa !== "false"

  const libranzas = await prisma.libranza.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      empleado: { select: { id: true, nombre: true, numeroDocumento: true } },
    },
  })

  return NextResponse.json({
    libranzas: libranzas.map(l => ({
      ...l,
      valorCuota: l.valorCuota.toString(),
      saldoCuotas: l.numeroCuotas - l.cuotaActual + 1,
    })),
  })
}

export async function POST(request: NextRequest) {
  const session = await getNominaSession()
  if (!session) return unauthorized()
  if (!isContador(session)) return forbidden("Solo contadores y administradores pueden registrar libranzas")

  const body = await request.json()
  const { empresaId, empleadoId, entidad, numeroPrestamo, valorCuota, numeroCuotas, fechaInicio, observaciones } = body

  const errors: string[] = []
  if (!empresaId) errors.push("empresaId es requerido")
  if (!empleadoId) errors.push("empleadoId es requerido")
  if (!entidad?.trim()) errors.push("entidad es requerida")
  if (!valorCuota || Number(valorCuota) <= 0) errors.push("valorCuota debe ser mayor que cero")
  if (!numeroCuotas || Number(numeroCuotas) < 1) errors.push("numeroCuotas debe ser al menos 1")
  if (!fechaInicio) errors.push("fechaInicio es requerida")
  if (errors.length) return NextResponse.json({ error: "Validación fallida", details: errors }, { status: 400 })

  if (!canAccess(session, empresaId)) return forbidden()

  const empleado = await prisma.empleado.findUnique({ where: { id: empleadoId } })
  if (!empleado) return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 })
  if (!empleado.activo) return NextResponse.json({ error: "No se puede registrar una libranza para un empleado inactivo" }, { status: 409 })
  if (empleado.empresaId !== empresaId) return NextResponse.json({ error: "El empleado no pertenece a esta empresa" }, { status: 400 })

  const libranza = await prisma.libranza.create({
    data: {
      empresaId,
      empleadoId,
      entidad: entidad.trim(),
      numeroPrestamo: numeroPrestamo?.trim() || null,
      valorCuota,
      numeroCuotas: parseInt(numeroCuotas),
      cuotaActual: 1,
      fechaInicio: new Date(fechaInicio),
      activa: true,
      observaciones: observaciones?.trim() || null,
    },
    include: {
      empleado: { select: { id: true, nombre: true, numeroDocumento: true } },
    },
  })

  return NextResponse.json({ ...libranza, valorCuota: libranza.valorCuota.toString() }, { status: 201 })
}
