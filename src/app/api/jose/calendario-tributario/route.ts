import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { joseAuth, formatFecha, mapEstado, formatPeriodo } from "@/lib/jose-auth"
import { estadoEfectivo, buildEstadoWhere, buildDateRange } from "@/lib/calendario-helpers"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const denied = joseAuth(request)
  if (denied) return denied

  try {
    const { searchParams } = new URL(request.url)
    const empresaId = searchParams.get("empresa_id") ?? undefined
    const estadoParam = searchParams.get("estado")?.toLowerCase() ?? undefined
    const desdeParam = searchParams.get("desde") ?? undefined
    const hastaParam = searchParams.get("hasta") ?? undefined

    const now = new Date()
    const { desde, hasta } = buildDateRange(estadoParam, desdeParam, hastaParam, now)

    const where: Record<string, unknown> = {
      fechaVencimiento: { gte: desde, lte: hasta },
      ...(empresaId ? { empresaId } : {}),
      ...buildEstadoWhere(estadoParam),
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
      nota_interpretacion: [
        "estado: estado efectivo calculado desde las banderas booleanas (fuente de verdad).",
        "estado_workflow: valor guardado en la base de datos; puede estar desactualizado.",
        "Si estado != estado_workflow, significa que se marcaron los pasos operativos sin actualizar el estado del formulario.",
        "Para reportar cumplimiento, usa siempre 'estado' y las banderas pagado/declarado/contabilizado.",
      ],
      obligaciones: obligaciones.map((o) => {
        const efectivo = estadoEfectivo(
          o.pagado ?? false,
          o.declarado ?? false,
          o.contabilizado ?? false,
          o.fechaVencimiento,
          now
        )
        return {
          id: o.id,
          empresa: o.empresa.razonSocial,
          nit: o.empresa.nit,
          obligacion: o.tipoObligacion,
          periodicidad: o.periodicidad,
          periodo: formatPeriodo(Number(o.periodo) || 0, o.periodicidad, o.año),
          año: o.año,
          fecha_vencimiento: formatFecha(o.fechaVencimiento),
          estado: efectivo,
          estado_workflow: mapEstado(o.estado),
          contabilizado: o.contabilizado ?? false,
          contabilizado_fecha: o.contabilizadoFecha ? formatFecha(o.contabilizadoFecha) : null,
          declarado: o.declarado ?? false,
          declarado_fecha: o.declaradoFecha ? formatFecha(o.declaradoFecha) : null,
          pagado: o.pagado ?? false,
          pagado_fecha: o.pagadoFecha ? formatFecha(o.pagadoFecha) : null,
          responsable: o.responsable?.name ?? null,
          municipio: o.municipio ?? null,
        }
      }),
    })
  } catch (e) {
    console.error("[jose/calendario-tributario]", e)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
