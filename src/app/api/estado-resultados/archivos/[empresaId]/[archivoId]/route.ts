/**
 * GET /api/estado-resultados/archivos/[empresaId]/[archivoId]
 * → Returns the full EstadoResultados JSON for a specific upload.
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { reclasificarEstadoResultados } from "@/lib/estado-resultados/merger"
import { catalogoToAutoExcepciones } from "@/lib/estado-resultados/catalogo"
import type { EstadoResultados } from "@/lib/estado-resultados/types"

interface Params { empresaId: string; archivoId: string }

export async function GET(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { empresaId, archivoId } = await params

  const archivo = await prisma.estadoResultadosArchivo.findUnique({
    where: { id: archivoId },
  })

  if (!archivo || archivo.empresaId !== empresaId) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  }

  // Apply current exceptions at read time so the viewer always reflects latest config
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
  const estadoResultados = reclasificarEstadoResultados(
    archivo.resultado as unknown as EstadoResultados,
    excepciones
  )

  return NextResponse.json({
    id:             archivo.id,
    nombreArchivo:  archivo.nombreArchivo,
    mesesCubiertos: archivo.mesesCubiertos,
    createdAt:      archivo.createdAt,
    estadoResultados,
  })
}
