import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { joseAuth, formatFecha, mapEstado, formatPeriodo } from "@/lib/jose-auth"

export const dynamic = "force-dynamic"

/**
 * Derives the real compliance status from the boolean step flags and due date.
 * Priority: pagado > declarado > contabilizado > vencido (by date) > pendiente.
 *
 * This intentionally ignores the DB `estado` field which can lag behind because
 * users mark individual steps (contabilizado / declarado / pagado) without always
 * updating the workflow state enum.
 */
function estadoEfectivo(
  pagado: boolean,
  declarado: boolean,
  contabilizado: boolean,
  fechaVencimiento: Date,
  now: Date
): string {
  if (pagado) return "pagado"
  if (declarado) return "presentado"
  if (contabilizado) return "en_proceso"
  if (fechaVencimiento < now) return "vencido"
  return "pendiente"
}

/**
 * Maps the friendly `estado` query param to Prisma WHERE conditions using
 * the boolean flags as the source of truth, not the DB enum.
 *
 * Meanings:
 *   pendiente  → none of the 3 steps done AND due date is still in the future
 *   en_proceso → contabilizado=true, but not yet declared or paid
 *   presentado → declarado=true (filed/submitted), but not yet paid
 *   pagado     → pagado=true (fully complete)
 *   vencido    → not paid, not declared, AND due date is already past
 */
function buildEstadoWhere(param: string | undefined): Record<string, unknown> {
  switch (param) {
    case "pagado":
      return { pagado: true }
    case "presentado":
      return { declarado: true, pagado: false }
    case "en_proceso":
      return { contabilizado: true, declarado: false, pagado: false }
    case "vencido":
      // Date condition (lt: now) is applied via the date range — see below
      return { pagado: false, declarado: false }
    case "pendiente":
      return { contabilizado: false, declarado: false, pagado: false }
    default:
      return {}
  }
}

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

    // Default date range depends on the filter intent:
    //   vencido → look back 365 days (past obligations); cap at now
    //   others  → look forward 30 days (upcoming obligations)
    const isVencido = estadoParam === "vencido"
    const desde = desdeParam
      ? new Date(desdeParam)
      : isVencido
        ? new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        : now
    const hasta = hastaParam
      ? new Date(hastaParam)
      : isVencido
        ? now // overdue = past due date
        : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

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
      // ── Interpretation guide for the AI assistant ─────────────────────────
      // `estado`          → effective compliance status derived from boolean flags
      //                     (pagado / declarado / contabilizado / fecha). Use this.
      // `estado_workflow` → raw workflow enum stored in the DB. May be stale if
      //                     staff marked steps without updating the dropdown.
      //                     Useful for detecting drift (estado_workflow != estado).
      // Steps (boolean + date):
      //   contabilizado   → accounting entry booked
      //   declarado       → tax return / declaration filed with authority
      //   pagado          → payment sent / confirmed
      // A record where estado="pendiente" but pagado=true means the workflow
      // enum was NOT updated after the payment was recorded. Trust pagado=true.
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
          // ── Status fields ──────────────────────────────────────────────────
          estado: efectivo,                   // source of truth
          estado_workflow: mapEstado(o.estado), // raw DB value (may differ)
          // ── Individual completion steps ────────────────────────────────────
          contabilizado: o.contabilizado ?? false,
          contabilizado_fecha: o.contabilizadoFecha ? formatFecha(o.contabilizadoFecha) : null,
          declarado: o.declarado ?? false,
          declarado_fecha: o.declaradoFecha ? formatFecha(o.declaradoFecha) : null,
          pagado: o.pagado ?? false,
          pagado_fecha: o.pagadoFecha ? formatFecha(o.pagadoFecha) : null,
          // ── Extra ──────────────────────────────────────────────────────────
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
