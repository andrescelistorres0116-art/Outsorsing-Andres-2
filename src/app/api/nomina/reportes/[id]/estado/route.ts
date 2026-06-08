import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getNominaSession, canAccess, isContador, isAdmin, unauthorized, forbidden } from "@/lib/nomina-auth"
import { EstadoReporteNomina, ModoFlujoNomina } from "@prisma/client"

export const dynamic = "force-dynamic"

type Transicion = {
  desde: EstadoReporteNomina[]
  hacia: EstadoReporteNomina
  soloContador?: boolean
  soloAdmin?: boolean
  updateData: (userId: string, ts: Date) => Record<string, any>
}

const TRANSICIONES_COMPLETO: Transicion[] = [
  { desde: [EstadoReporteNomina.BORRADOR], hacia: EstadoReporteNomina.ENVIADA, updateData: (id, ts) => ({ enviadoPorId: id, fechaEnvio: ts }) },
  { desde: [EstadoReporteNomina.ENVIADA], hacia: EstadoReporteNomina.REVISADA, soloContador: true, updateData: (id, ts) => ({ revisadoPorId: id, fechaRevision: ts }) },
  { desde: [EstadoReporteNomina.REVISADA], hacia: EstadoReporteNomina.APROBADA, soloContador: true, updateData: (id, ts) => ({ aprobadoPorId: id, fechaAprobacion: ts }) },
  { desde: [EstadoReporteNomina.APROBADA], hacia: EstadoReporteNomina.REABIERTA, soloAdmin: true, updateData: (id, _ts) => ({ cerradoPorId: id }) },
  { desde: [EstadoReporteNomina.REABIERTA], hacia: EstadoReporteNomina.CORREGIDA, updateData: () => ({}) },
  { desde: [EstadoReporteNomina.CORREGIDA], hacia: EstadoReporteNomina.APROBADA, soloContador: true, updateData: (id, ts) => ({ aprobadoPorId: id, fechaAprobacion: ts }) },
]

const TRANSICIONES_SIMPLE: Transicion[] = [
  // Client (or contador/admin) finalizes: BORRADOR → APROBADA
  { desde: [EstadoReporteNomina.BORRADOR], hacia: EstadoReporteNomina.APROBADA, updateData: (id, ts) => ({ aprobadoPorId: id, fechaAprobacion: ts }) },
  // Only admin can reopen an approved report
  { desde: [EstadoReporteNomina.APROBADA], hacia: EstadoReporteNomina.REABIERTA, soloAdmin: true, updateData: (id, _ts) => ({ cerradoPorId: id }) },
  // Client (or contador/admin) re-approves after reopening or correction
  { desde: [EstadoReporteNomina.REABIERTA, EstadoReporteNomina.CORREGIDA], hacia: EstadoReporteNomina.APROBADA, updateData: (id, ts) => ({ aprobadoPorId: id, fechaAprobacion: ts }) },
]

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getNominaSession()
  if (!session) return unauthorized()

  const { id } = await context.params
  const body = await request.json()
  const { estadoNuevo, observaciones } = body

  if (!estadoNuevo) return NextResponse.json({ error: "estadoNuevo es requerido" }, { status: 400 })

  const reporte = await prisma.reporteNomina.findUnique({
    where: { id },
    include: { empresa: { select: { modoFlujoNomina: true } } },
  })
  if (!reporte) return NextResponse.json({ error: "Reporte no encontrado" }, { status: 404 })
  if (!canAccess(session, reporte.empresaId)) return forbidden()

  const modo = reporte.empresa.modoFlujoNomina
  const transiciones = modo === ModoFlujoNomina.SIMPLE ? TRANSICIONES_SIMPLE : TRANSICIONES_COMPLETO

  const transicion = transiciones.find(
    t => t.desde.includes(reporte.estado) && t.hacia === estadoNuevo
  )

  if (!transicion) {
    return NextResponse.json({
      error: `Transición no permitida: ${reporte.estado} → ${estadoNuevo} en modo ${modo}`,
    }, { status: 409 })
  }

  if (transicion.soloAdmin && !isAdmin(session)) {
    return NextResponse.json({ error: "Solo administradores pueden realizar esta transición" }, { status: 403 })
  }
  if (transicion.soloContador && !isContador(session)) {
    return NextResponse.json({ error: "Solo contadores o administradores pueden realizar esta transición" }, { status: 403 })
  }

  const ahora = new Date()
  const actorData = transicion.updateData(session.userId, ahora)

  const [updated] = await prisma.$transaction([
    prisma.reporteNomina.update({
      where: { id },
      data: { estado: estadoNuevo as EstadoReporteNomina, ...actorData },
    }),
    prisma.auditoriaReporte.create({
      data: {
        reporteNominaId: id,
        accion: `ESTADO_${reporte.estado}_A_${estadoNuevo}`,
        estadoAntes: reporte.estado,
        estadoDespues: estadoNuevo as EstadoReporteNomina,
        realizadoPorId: session.userId,
        observaciones: observaciones?.trim() || null,
      },
    }),
  ])

  return NextResponse.json(updated)
}
