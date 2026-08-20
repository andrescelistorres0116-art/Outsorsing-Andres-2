import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { joseAuth, formatFecha } from "@/lib/jose-auth"

export const dynamic = "force-dynamic"

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

function mapEstadoReporte(e: string): string {
  return (
    {
      BORRADOR: "borrador",
      ENVIADA: "enviada",
      REVISADA: "revisada",
      APROBADA: "aprobada",
      REABIERTA: "reabierta",
      CORREGIDA: "corregida",
    }[e] ?? e.toLowerCase()
  )
}

export async function GET(request: NextRequest) {
  const denied = joseAuth(request)
  if (denied) return denied

  try {
    const { searchParams } = new URL(request.url)
    const empresaId = searchParams.get("empresa_id") ?? undefined

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // 1-based

    const [reportes, empleadosPorEmpresa] = await Promise.all([
      prisma.reporteNomina.findMany({
        where: {
          ...(empresaId ? { empresaId } : {}),
          OR: [
            { año: currentYear },
            { año: currentYear - 1, mes: { gte: 10 } }, // recent past months
          ],
        },
        orderBy: [{ año: "desc" }, { mes: "desc" }],
        include: {
          empresa: { select: { razonSocial: true, nit: true, tipoNomina: true, periodicidadNomina: true } },
          enviadoPor: { select: { name: true } },
          aprobadoPor: { select: { name: true } },
        },
        take: 100,
      }),
      prisma.empleado.groupBy({
        by: ["empresaId"],
        where: { activo: true, ...(empresaId ? { empresaId } : {}) },
        _count: { id: true },
      }),
    ])

    const empleadosMap = new Map(empleadosPorEmpresa.map((e) => [e.empresaId, e._count.id]))

    const pendientes = reportes.filter((r) => ["BORRADOR", "ENVIADA"].includes(r.estado))
    const aprobados = reportes.filter((r) => r.estado === "APROBADA")

    return NextResponse.json({
      fecha_consulta: formatFecha(now),
      resumen: {
        reportes_pendientes: pendientes.length,
        reportes_aprobados_recientes: aprobados.length,
        periodo_actual: `${MESES[currentMonth - 1]} ${currentYear}`,
      },
      reportes_pendientes: pendientes.map((r) => ({
        id: r.id,
        empresa: r.empresa.razonSocial,
        nit: r.empresa.nit,
        periodo: `${MESES[r.mes - 1]} ${r.año}`,
        estado: mapEstadoReporte(r.estado),
        tipo_nomina: r.empresa.tipoNomina ?? null,
        periodicidad: r.empresa.periodicidadNomina ?? null,
        empleados_activos: empleadosMap.get(r.empresaId) ?? 0,
        enviado_por: r.enviadoPor?.name ?? null,
        fecha_envio: r.fechaEnvio ? formatFecha(r.fechaEnvio) : null,
        sin_novedades: r.sinNovedades ?? false,
        comentarios: r.comentarios ?? null,
      })),
      reportes_aprobados_recientes: aprobados.slice(0, 10).map((r) => ({
        id: r.id,
        empresa: r.empresa.razonSocial,
        nit: r.empresa.nit,
        periodo: `${MESES[r.mes - 1]} ${r.año}`,
        estado: mapEstadoReporte(r.estado),
        aprobado_por: r.aprobadoPor?.name ?? null,
        fecha_aprobacion: r.fechaAprobacion ? formatFecha(r.fechaAprobacion) : null,
        empleados_activos: empleadosMap.get(r.empresaId) ?? 0,
      })),
    })
  } catch (e) {
    console.error("[jose/nomina]", e)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
