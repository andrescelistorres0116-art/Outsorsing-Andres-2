import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { getNominaSession, canAccess, isContador, unauthorized, forbidden } from "@/lib/nomina-auth"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const session = await getNominaSession()
  if (!session) return unauthorized()

  const { searchParams } = new URL(request.url)
  const empresaId = searchParams.get("empresaId")
  const activo = searchParams.get("activo")
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"))

  if (!empresaId) return NextResponse.json({ error: "empresaId requerido" }, { status: 400 })
  if (!canAccess(session, empresaId)) return forbidden()

  const fechaIni = searchParams.get("fechaIni") || undefined
  const fechaFin = searchParams.get("fechaFin") || undefined

  const where: any = { empresaId }
  if (activo !== null) where.activo = activo !== "false"

  // Filter employees who were active during the given period
  if (fechaIni || fechaFin) {
    const periodEnd = fechaFin ? new Date(fechaFin) : undefined
    const periodStart = fechaIni ? new Date(fechaIni) : undefined
    if (periodStart) where.fechaIngreso = { lte: periodEnd ?? new Date() }
    where.OR = [
      { fechaRetiro: null },
      { fechaRetiro: { gte: periodStart ?? new Date(0) } },
    ]
  }

  const [empleados, total] = await Promise.all([
    prisma.empleado.findMany({
      where,
      orderBy: { nombre: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.empleado.count({ where }),
  ])

  return NextResponse.json({ empleados, total, page, limit })
}

export async function POST(request: NextRequest) {
  const session = await getNominaSession()
  if (!session) return unauthorized()
  if (!isContador(session)) return forbidden("Solo contadores y administradores pueden registrar empleados")

  const body = await request.json()
  const { empresaId, numeroDocumento, nombre, tipoDocumento, cargo, salarioBase, tipoContrato, ciudad, eps, fondoPensiones, fechaIngreso, observaciones } = body

  const errors: string[] = []
  if (!empresaId) errors.push("empresaId es requerido")
  if (!numeroDocumento?.trim()) errors.push("numeroDocumento es requerido")
  if (!nombre?.trim() || nombre.trim().length < 2) errors.push("nombre debe tener al menos 2 caracteres")
  if (salarioBase !== undefined && salarioBase !== null && Number(salarioBase) <= 0) errors.push("salarioBase debe ser mayor que cero")
  if (fechaIngreso && new Date(fechaIngreso) > new Date()) errors.push("fechaIngreso no puede ser una fecha futura")
  if (errors.length) return NextResponse.json({ error: "Validación fallida", details: errors }, { status: 400 })

  if (!canAccess(session, empresaId)) return forbidden()

  const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } })
  if (!empresa) return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })

  try {
    const empleado = await prisma.empleado.create({
      data: {
        empresaId,
        numeroDocumento: numeroDocumento.trim(),
        nombre: nombre.trim(),
        tipoDocumento: tipoDocumento?.trim() || null,
        cargo: cargo?.trim() || null,
        salarioBase: salarioBase != null ? salarioBase : null,
        tipoContrato: tipoContrato?.trim() || null,
        ciudad: ciudad?.trim() || null,
        eps: eps?.trim() || null,
        fondoPensiones: fondoPensiones?.trim() || null,
        fechaIngreso: fechaIngreso ? new Date(fechaIngreso) : null,
        observaciones: observaciones?.trim() || null,
      },
    })

    await prisma.auditoriaEmpleado.create({
      data: {
        empleadoId: empleado.id,
        accion: "CREADO",
        camposAntes: Prisma.DbNull,
        camposDespues: { ...empleado, salarioBase: empleado.salarioBase?.toString() ?? null },
        realizadoPorId: session.userId,
      },
    })

    return NextResponse.json(empleado, { status: 201 })
  } catch (error: any) {
    if (error?.code === "P2002") return NextResponse.json({ error: "Ya existe un empleado con ese número de documento en esta empresa" }, { status: 409 })
    console.error(error)
    return NextResponse.json({ error: "Error al crear empleado" }, { status: 500 })
  }
}
