import { NextRequest, NextResponse } from "next/server"
import { generarReportesMes, mesActual } from "@/lib/generar-nominas"
import { getNominaSession, isContador, unauthorized, forbidden } from "@/lib/nomina-auth"

export const dynamic = "force-dynamic"

/**
 * POST /api/nomina/generar
 * Body (optional): { mes?: number, año?: number }
 *
 * Genera los reportes de nómina faltantes para todas las empresas activas.
 * Sin body → genera el mes actual.
 * Solo accesible por contadores y administradores.
 *
 * Railway cron: llama este endpoint vía HTTP el día 1 de cada mes.
 */
export async function POST(request: NextRequest) {
  const session = await getNominaSession()
  if (!session) return unauthorized()
  if (!isContador(session)) return forbidden("Solo contadores y administradores pueden ejecutar esta acción")

  let mes: number
  let año: number

  try {
    const body = await request.json().catch(() => ({}))
    const actual = mesActual()
    mes = Number(body.mes ?? actual.mes)
    año = Number(body.año ?? actual.año)

    if (mes < 1 || mes > 12) return NextResponse.json({ error: "mes debe ser entre 1 y 12" }, { status: 400 })
    if (año < 2020 || año > 2035) return NextResponse.json({ error: "año debe ser entre 2020 y 2035" }, { status: 400 })
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }

  const result = await generarReportesMes(mes, año)

  return NextResponse.json({
    ok: true,
    mes,
    año,
    ...result,
    mensaje: `${result.creados} reportes creados, ${result.omitidos} ya existían`,
  })
}
