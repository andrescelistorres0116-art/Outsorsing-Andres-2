/**
 * GET /api/estado-resultados/archivos/[empresaId]/[archivoId]
 * → Returns the full EstadoResultados JSON for a specific upload.
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

  return NextResponse.json({
    id:             archivo.id,
    nombreArchivo:  archivo.nombreArchivo,
    mesesCubiertos: archivo.mesesCubiertos,
    createdAt:      archivo.createdAt,
    estadoResultados: archivo.resultado,
  })
}
