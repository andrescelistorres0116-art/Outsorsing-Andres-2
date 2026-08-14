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
import { mergeEstadoResultados, reclasificarEstadoResultados } from "@/lib/estado-resultados/merger"
import { catalogoToAutoExcepciones } from "@/lib/estado-resultados/catalogo"
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
    // Load exceptions (manual + catalog auto) for real-time reclassification
    const excepcionesDb = await prisma.estadoResultadosExcepcion.findMany({
      where: { empresaId },
      select: { prefijoCuenta: true, categoriaDestino: true },
    })
    const catalogoDb = await prisma.catalogoCuenta.findMany({
      where: { empresaId },
      select: { codigo: true, tipo: true },
    })
    const excepciones = [
      ...excepcionesDb.map(e => ({ prefijoCuenta: e.prefijoCuenta, categoriaDestino: e.categoriaDestino as any })),
      ...catalogoToAutoExcepciones(catalogoDb),
    ]

    // Reclassify each stored result with current exceptions, then merge
    const ers = archivos.map(a => {
      const er = a.resultado as unknown as EstadoResultados
      return reclasificarEstadoResultados(er, excepciones)
    })
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
