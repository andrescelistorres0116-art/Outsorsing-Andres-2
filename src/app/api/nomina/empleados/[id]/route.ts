import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getNominaSession, canAccess, isContador, unauthorized, forbidden } from "@/lib/nomina-auth"

export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getNominaSession()
  if (!session) return unauthorized()

  const { id } = await context.params
  const empleado = await prisma.empleado.findUnique({
    where: { id },
    include: {
      libranzas: { where: { activa: true }, orderBy: { createdAt: "desc" } },
    },
  })
  if (!empleado) return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 })
  if (!canAccess(session, empleado.empresaId)) return forbidden()

  return NextResponse.json({
    ...empleado,
    salarioBase: empleado.salarioBase?.toString() ?? null,
    libranzas: empleado.libranzas.map(l => ({ ...l, valorCuota: l.valorCuota.toString() })),
  })
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getNominaSession()
  if (!session) return unauthorized()

  const { id } = await context.params
  const existing = await prisma.empleado.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 })
  if (!canAccess(session, existing.empresaId)) return forbidden()

  const body = await request.json()
  const { nombre, tipoDocumento, numeroDocumento, cargo, salarioBase, tipoContrato, ciudad, fechaIngreso, fechaRetiro, observaciones, activo } = body

  const errors: string[] = []
  if (nombre !== undefined && (!nombre?.trim() || nombre.trim().length < 2)) errors.push("nombre debe tener al menos 2 caracteres")
  if (salarioBase !== undefined && salarioBase !== null && Number(salarioBase) <= 0) errors.push("salarioBase debe ser mayor que cero")
  if (activo === false && !observaciones?.trim()) errors.push("observaciones (motivo de retiro) es obligatorio al desactivar un empleado")

  const resolvedIngreso = fechaIngreso !== undefined ? new Date(fechaIngreso) : existing.fechaIngreso
  const resolvedRetiro = fechaRetiro !== undefined ? new Date(fechaRetiro) : existing.fechaRetiro
  if (resolvedIngreso && resolvedRetiro && resolvedRetiro <= resolvedIngreso) {
    errors.push("fechaRetiro debe ser posterior a fechaIngreso")
  }
  if (errors.length) return NextResponse.json({ error: "Validación fallida", details: errors }, { status: 400 })

  const updateData: any = {}
  if (nombre !== undefined) updateData.nombre = nombre.trim()
  if (tipoDocumento !== undefined) updateData.tipoDocumento = tipoDocumento?.trim() || null
  if (numeroDocumento !== undefined) updateData.numeroDocumento = numeroDocumento.trim()
  if (cargo !== undefined) updateData.cargo = cargo?.trim() || null
  if (salarioBase !== undefined) updateData.salarioBase = salarioBase
  if (tipoContrato !== undefined) updateData.tipoContrato = tipoContrato?.trim() || null
  if (ciudad !== undefined) updateData.ciudad = ciudad?.trim() || null
  if (fechaIngreso !== undefined) updateData.fechaIngreso = fechaIngreso ? new Date(fechaIngreso) : null
  if (fechaRetiro !== undefined) updateData.fechaRetiro = fechaRetiro ? new Date(fechaRetiro) : null
  if (observaciones !== undefined) updateData.observaciones = observaciones?.trim() || null
  if (activo !== undefined) {
    updateData.activo = activo
    if (activo === false && !updateData.fechaRetiro && !existing.fechaRetiro) {
      updateData.fechaRetiro = new Date()
    }
  }

  try {
    const updated = await prisma.empleado.update({ where: { id }, data: updateData })

    await prisma.auditoriaEmpleado.create({
      data: {
        empleadoId: id,
        accion: activo === false ? "RETIRADO" : "ACTUALIZADO",
        camposAntes: { ...existing, salarioBase: existing.salarioBase?.toString() ?? null },
        camposDespues: { ...updated, salarioBase: updated.salarioBase?.toString() ?? null },
        realizadoPorId: session.userId,
      },
    })

    return NextResponse.json({ ...updated, salarioBase: updated.salarioBase?.toString() ?? null })
  } catch (error: any) {
    if (error?.code === "P2002") return NextResponse.json({ error: "Ya existe un empleado con ese número de documento" }, { status: 409 })
    return NextResponse.json({ error: "Error al actualizar empleado" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getNominaSession()
  if (!session) return unauthorized()
  if (!isContador(session)) return forbidden("Solo contadores y administradores pueden eliminar empleados")

  const { id } = await context.params
  const existing = await prisma.empleado.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 })
  if (!canAccess(session, existing.empresaId)) return forbidden()

  // Check if employee has novedades
  const hasNovedades = await prisma.novedadNomina.count({ where: { empleadoId: id } })
  if (hasNovedades > 0) {
    // Cannot hard delete; soft delete instead
    return NextResponse.json({ error: "Empleado con novedades registradas no puede eliminarse. Use PATCH para desactivarlo." }, { status: 409 })
  }

  await prisma.empleado.delete({ where: { id } })
  return NextResponse.json({ message: "Empleado eliminado" })
}
