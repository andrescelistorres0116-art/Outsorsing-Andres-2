import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma, TipoNovedad, EstadoReporteNomina } from "@prisma/client"
import { getNominaSession, canAccess, isContador, unauthorized, forbidden } from "@/lib/nomina-auth"

export const dynamic = "force-dynamic"

const ESTADOS_EDITABLES: EstadoReporteNomina[] = [EstadoReporteNomina.BORRADOR, EstadoReporteNomina.REABIERTA, EstadoReporteNomina.CORREGIDA]

function validateNovedad(tipo: TipoNovedad, body: any): string[] {
  const errors: string[] = []
  const val = (f: string) => body[f]
  const num = (f: string) => Number(val(f))
  const has = (f: string) => val(f) !== undefined && val(f) !== null && val(f) !== ""

  switch (tipo) {
    case TipoNovedad.HORAS_EXTRAS:
    case TipoNovedad.HORAS_EXTRAS_NOCTURNAS:
    case TipoNovedad.DOMINICALES:
    case TipoNovedad.RECARGOS:
      // UI captures hours only; monetary calculation happens externally
      if (!has("horas") || num("horas") <= 0) errors.push("horas debe ser mayor que cero")
      break
    case TipoNovedad.BONIFICACIONES:
    case TipoNovedad.COMISIONES:
    case TipoNovedad.EMBARGO:
      if (!has("valor") || num("valor") <= 0) errors.push("valor debe ser mayor que cero")
      break
    case TipoNovedad.INCAPACIDAD:
    case TipoNovedad.VACACIONES:
    case TipoNovedad.LICENCIA:
      // UI captures date range; diasAusencia is optional (calculated externally)
      if (!has("fechaInicioNovedad")) errors.push("fechaInicioNovedad es requerida")
      if (!has("fechaFinNovedad")) errors.push("fechaFinNovedad es requerida")
      break
    case TipoNovedad.LIBRANZA:
      // Allow either existing libranzaId or inline creation via entidad field
      if (!has("libranzaId") && !has("entidad")) {
        errors.push("Se requiere una libranza existente o los datos para crear una nueva (entidad)")
      }
      break
    case TipoNovedad.INGRESO:
      if (!has("fechaInicioNovedad")) errors.push("fechaInicioNovedad (fecha de ingreso) es requerida")
      break
    case TipoNovedad.RETIRO:
      if (!has("fechaFinNovedad")) errors.push("fechaFinNovedad (fecha de retiro) es requerida")
      break
    case TipoNovedad.LLEGADA_TARDE:
      // UI captures days count via diasAusencia
      if (!has("diasAusencia") || num("diasAusencia") <= 0) errors.push("diasAusencia debe ser mayor que cero")
      break
    case TipoNovedad.OTRA:
      if (!has("descripcion")) errors.push("La observación es obligatoria para otras novedades")
      break
    case TipoNovedad.AUSENCIA:
      if ((!has("diasAusencia") || num("diasAusencia") <= 0) && (!has("horas") || num("horas") <= 0)) {
        errors.push("diasAusencia o horas deben ser mayores que cero")
      }
      break
  }

  // Date range validation
  if (has("fechaInicioNovedad") && has("fechaFinNovedad")) {
    if (new Date(val("fechaFinNovedad")) < new Date(val("fechaInicioNovedad"))) {
      errors.push("fechaFinNovedad debe ser igual o posterior a fechaInicioNovedad")
    }
  }

  return errors
}

export async function GET(request: NextRequest) {
  const session = await getNominaSession()
  if (!session) return unauthorized()

  const { searchParams } = new URL(request.url)
  const empresaId = searchParams.get("empresaId")
  const empleadoId = searchParams.get("empleadoId") || undefined
  const mes = searchParams.get("mes") ? parseInt(searchParams.get("mes")!) : undefined
  const año = searchParams.get("año") ? parseInt(searchParams.get("año")!) : undefined
  const periodo = searchParams.get("periodo") || undefined
  const tipoNovedad = searchParams.get("tipoNovedad") || undefined
  const reporteId = searchParams.get("reporteId") || undefined
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"))

  if (!empresaId) return NextResponse.json({ error: "empresaId es requerido" }, { status: 400 })
  if (!canAccess(session, empresaId)) return forbidden()

  const where: any = { empresaId }
  if (empleadoId) where.empleadoId = empleadoId
  if (mes !== undefined) where.mes = mes
  if (año !== undefined) where.año = año
  if (periodo) where.periodo = periodo
  if (tipoNovedad) where.tipoNovedad = tipoNovedad
  if (reporteId) where.reporteId = reporteId

  const [novedades, total] = await Promise.all([
    prisma.novedadNomina.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ empleado: { nombre: "asc" } }, { tipoNovedad: "asc" }],
      include: {
        empleado: { select: { id: true, numeroDocumento: true, nombre: true, activo: true } },
        creadoPor: { select: { id: true, name: true } },
        libranza: { select: { id: true, entidad: true, cuotaActual: true, numeroCuotas: true } },
      },
    }),
    prisma.novedadNomina.count({ where }),
  ])

  return NextResponse.json({
    novedades: novedades.map(n => ({
      ...n,
      valor: n.valor?.toString() ?? null,
      tarifaHora: n.tarifaHora?.toString() ?? null,
      porcentaje: n.porcentaje?.toString() ?? null,
      horas: n.horas?.toString() ?? null,
      valorCuota: n.valorCuota?.toString() ?? null,
    })),
    total, page, limit,
  })
}

export async function POST(request: NextRequest) {
  const session = await getNominaSession()
  if (!session) return unauthorized()

  const body = await request.json()
  const { empresaId, empleadoId, reporteId, periodo, mes, año, tipoNovedad, libranzaId } = body

  // Base validations
  const errors: string[] = []
  if (!empresaId) errors.push("empresaId es requerido")
  if (!empleadoId) errors.push("empleadoId es requerido")
  if (!periodo) errors.push("periodo es requerido")
  if (mes === undefined || mes < 1 || mes > 12) errors.push("mes debe ser entre 1 y 12")
  if (año === undefined || año < 2020 || año > 2035) errors.push("año debe ser entre 2020 y 2035")
  if (!tipoNovedad) errors.push("tipoNovedad es requerido")
  if (errors.length) return NextResponse.json({ error: "Validación fallida", details: errors }, { status: 400 })

  if (!canAccess(session, empresaId)) return forbidden()

  // Check empleado activo
  const empleado = await prisma.empleado.findUnique({ where: { id: empleadoId } })
  if (!empleado) return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 })
  if (!empleado.activo && tipoNovedad !== TipoNovedad.RETIRO) {
    return NextResponse.json({ error: "Solo se pueden registrar novedades de RETIRO para empleados inactivos" }, { status: 409 })
  }
  if (empleado.empresaId !== empresaId) return NextResponse.json({ error: "El empleado no pertenece a esta empresa" }, { status: 400 })

  // Check reporte state if linked
  if (reporteId) {
    const reporte = await prisma.reporteNomina.findUnique({ where: { id: reporteId } })
    if (!reporte) return NextResponse.json({ error: "Reporte no encontrado" }, { status: 404 })
    if (!ESTADOS_EDITABLES.includes(reporte.estado)) {
      return NextResponse.json({ error: `No se pueden agregar novedades a un reporte en estado ${reporte.estado}` }, { status: 409 })
    }
  }

  // Type-specific validations
  const typeErrors = validateNovedad(tipoNovedad as TipoNovedad, body)
  if (typeErrors.length) return NextResponse.json({ error: "Validación fallida", details: typeErrors }, { status: 400 })

  // Libranza handling — auto-create if client provides inline data, or validate existing libranzaId
  let resolvedLibranzaId: string | null = libranzaId || null
  if (tipoNovedad === TipoNovedad.LIBRANZA) {
    if (libranzaId) {
      // Explicit libranza reference: validate it
      const libranza = await prisma.libranza.findUnique({ where: { id: libranzaId } })
      if (!libranza) return NextResponse.json({ error: "Libranza no encontrada" }, { status: 404 })
      if (!libranza.activa) return NextResponse.json({ error: "La libranza ya está pagada o inactiva" }, { status: 409 })
      if (libranza.empleadoId !== empleadoId) return NextResponse.json({ error: "La libranza no pertenece a este empleado" }, { status: 400 })
    } else {
      // Inline registration: auto-create the Libranza record transparently
      const { entidad, valorCuota: vc, numeroCuotas: nc, fechaInicioNovedad: fini } = body
      if (!entidad?.trim()) return NextResponse.json({ error: "entidad es requerida para registrar una libranza" }, { status: 400 })
      if (!vc || Number(vc) <= 0) return NextResponse.json({ error: "valorCuota debe ser mayor que cero" }, { status: 400 })
      if (!nc || Number(nc) <= 0) return NextResponse.json({ error: "numeroCuotas debe ser mayor que cero" }, { status: 400 })
      const nuevaLibranza = await prisma.libranza.create({
        data: {
          empleadoId,
          empresaId,
          entidad: entidad.trim(),
          numeroPrestamo: body.numeroPrestamo?.trim() || null,
          valorCuota: vc,
          numeroCuotas: parseInt(nc),
          cuotaActual: 1,
          fechaInicio: fini ? new Date(fini) : new Date(),
          activa: true,
        },
      })
      resolvedLibranzaId = nuevaLibranza.id
    }
  }

  // Validate retiro date within report period
  if (tipoNovedad === TipoNovedad.RETIRO && reporteId && body.fechaFinNovedad) {
    const reporte = await prisma.reporteNomina.findUnique({ where: { id: reporteId } })
    if (reporte?.fechaInicioPeriodo && reporte?.fechaFinPeriodo) {
      const retiroDate = new Date(body.fechaFinNovedad)
      if (retiroDate < reporte.fechaInicioPeriodo || retiroDate > reporte.fechaFinPeriodo) {
        return NextResponse.json({ error: "La fecha de retiro debe estar dentro del período del reporte" }, { status: 400 })
      }
    }
  }

  try {
    const novedad = await prisma.novedadNomina.create({
      data: {
        empresaId,
        empleadoId,
        reporteId: reporteId || null,
        periodo,
        mes: parseInt(mes),
        año: parseInt(año),
        tipoNovedad,
        valor: body.valor != null ? body.valor : null,
        tarifaHora: body.tarifaHora != null ? body.tarifaHora : null,
        porcentaje: body.porcentaje != null ? body.porcentaje : null,
        horas: body.horas != null ? body.horas : null,
        diasAusencia: body.diasAusencia ?? null,
        libranzaId: resolvedLibranzaId,
        numeroCuotas: body.numeroCuotas ?? null,
        valorCuota: body.valorCuota != null ? body.valorCuota : null,
        cuotaNumero: body.cuotaNumero ?? null,
        fechaInicioNovedad: body.fechaInicioNovedad ? new Date(body.fechaInicioNovedad) : null,
        fechaFinNovedad: body.fechaFinNovedad ? new Date(body.fechaFinNovedad) : null,
        descripcion: body.descripcion?.trim() || null,
        adjunto: body.adjunto?.trim() || null,
        creadoPorId: session.userId,
      },
    })

    // Auto-deactivate employee on RETIRO
    if (tipoNovedad === TipoNovedad.RETIRO) {
      await prisma.empleado.update({
        where: { id: empleadoId },
        data: {
          activo: false,
          fechaRetiro: body.fechaFinNovedad ? new Date(body.fechaFinNovedad) : new Date(),
        },
      })
    }

    // Advance libranza cuota after novedad creation
    if (tipoNovedad === TipoNovedad.LIBRANZA && resolvedLibranzaId) {
      const libranza = await prisma.libranza.findUnique({ where: { id: resolvedLibranzaId } })
      if (libranza && libranzaId) {
        // Only advance cuota for pre-existing libranzas (auto-created ones start at cuota 1 already)
        const nuevaCuota = libranza.cuotaActual + 1
        await prisma.libranza.update({
          where: { id: resolvedLibranzaId },
          data: {
            cuotaActual: nuevaCuota,
            activa: nuevaCuota <= libranza.numeroCuotas,
          },
        })
      }
    }

    await prisma.auditoriaNovedad.create({
      data: {
        novedadNominaId: novedad.id,
        accion: "CREADO",
        camposAntes: Prisma.DbNull,
        camposDespues: { tipoNovedad, valor: novedad.valor?.toString() ?? null, horas: novedad.horas?.toString() ?? null },
        realizadoPorId: session.userId,
      },
    })

    return NextResponse.json({
      ...novedad,
      libranzaId: resolvedLibranzaId,
      valor: novedad.valor?.toString() ?? null,
      tarifaHora: novedad.tarifaHora?.toString() ?? null,
      porcentaje: novedad.porcentaje?.toString() ?? null,
      horas: novedad.horas?.toString() ?? null,
      valorCuota: novedad.valorCuota?.toString() ?? null,
    }, { status: 201 })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: "Error al crear novedad" }, { status: 500 })
  }
}
