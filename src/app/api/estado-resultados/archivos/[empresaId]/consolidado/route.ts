/**
 * GET /api/estado-resultados/archivos/[empresaId]/consolidado
 *
 * Returns a single EstadoResultados that merges ALL uploaded archives for this
 * empresa into one combined view with every stored month as a column.
 *
 * Query params:
 *   ids=id1,id2,…  (optional) — limit to specific archive IDs.
 *                  Omit to include all archives.
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { mergeEstadoResultados } from "@/lib/estado-resultados/merger"
import type { EstadoResultados } from "@/lib/estado-resultados/types"

interface Params { empresaId: string }

export async function GET(req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { empresaId } = await params
  const idsParam = new URL(req.url).searchParams.get("ids")

  const where = idsParam
    ? { empresaId, id: { in: idsParam.split(",").filter(Boolean) } }
    : { empresaId }

  const archivos = await prisma.estadoResultadosArchivo.findMany({
    where,
    select: { id: true, resultado: true, mesesCubiertos: true },
    orderBy: { createdAt: "asc" },   // oldest first so months are in order
  })

  if (archivos.length === 0) {
    return NextResponse.json({ error: "No hay archivos para consolidar" }, { status: 404 })
  }

  try {
    const ers = archivos.map(a => a.resultado as unknown as EstadoResultados)
    const consolidado = mergeEstadoResultados(ers)
    return NextResponse.json({ ok: true, estadoResultados: consolidado })
  } catch (err: any) {
    console.error("[consolidado/GET] Error:", err)
    return NextResponse.json(
      { error: err?.message ?? "Error al consolidar" },
      { status: 500 }
    )
  }
}
