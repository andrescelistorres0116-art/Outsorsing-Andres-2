import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { joseAuth, formatFecha, mapEstado, formatPeriodo } from "@/lib/jose-auth"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const denied = joseAuth(request)
  if (denied) return denied

  try {
    const { searchParams } = new URL(request.url)
    const empresaId = searchParams.get("empresa_id") ?? undefined
    const estadoParam = searchParams.get("estado") ?? undefined
    const desdeParam = searchParams.get("desde") ?? undefined
    const hastaParam = searchParams.get("hasta") ?? undefined

    // Default range: next 30 days
    const now = new Date()
    const defaultHasta = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const desde = desdeParam ? new Date(desdeParam) : now
    const hasta = hastaParam ? new Date(hastaParam) : defaultHasta

    // Map friendly estado param to DB enum
    const ESTADO_MAP: Record<string, string> = {
      pendiente: "PENDIENTE",
      en_proceso: "EN_PROCESO",
      presentado: "PRESENTADO",
      pagado: "PAGADO",
      vencido: "VENCIDO",
    }
    const estadoDB = estadoParam ? ESTADO_MAP[estadoParam.toLowerCase()] : undefined

    const where: any = {
      fechaVencimiento: { gte: desde, lte: hasta },
      ...(empresaId ? { empresaId } : {}),
      ...(estadoDB ? { estado: estadoDB } : {}),
    }

    const obligaciones = await prisma.obligacionTributaria.findMany({
      where,
      orderBy: { fechaVencimiento: "asc" },
      include: {
        empresa: { select: { razonSocial: true, nit: true } },
        responsable: { select: { name: true } },
      },
      take: 200,
    })

    return NextResponse.json({
      fecha_consulta: formatFecha(now),
      filtros: {
        desde: formatFecha(desde),
        hasta: formatFecha(hasta),
        estado: estadoParam ?? "todos",
        empresa_id: empresaId ?? "todas",
      },
      total: obligaciones.length,
      obligaciones: obligaciones.map((o) => ({
        id: o.id,
        empresa: o.empresa.razonSocial,
        nit: o.empresa.nit,
        obligacion: o.tipoObligacion,
        periodicidad: o.periodicidad,
        periodo: formatPeriodo(Number(o.periodo) || 0, o.periodicidad, o.año),
        año: o.año,
        fecha_vencimiento: formatFecha(o.fechaVencimiento),
        estado: mapEstado(o.estado),
        responsable: o.responsable?.name ?? null,
        contabilizado: o.contabilizado ?? false,
        declarado: o.declarado ?? false,
        pagado: o.pagado ?? false,
        municipio: (o as any).municipio ?? null,
      })),
    })
  } catch (e) {
    console.error("[jose/calendario-tributario]", e)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
