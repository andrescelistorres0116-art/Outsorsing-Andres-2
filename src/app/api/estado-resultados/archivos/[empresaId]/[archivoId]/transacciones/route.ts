/**
 * GET /api/estado-resultados/archivos/[empresaId]/[archivoId]/transacciones
 *
 * Returns individual movements for a specific cell in the Estado de Resultados.
 *
 * Required query params:
 *   cuentas=CODE1,CODE2,…   account codes for the line (from linea.cuentas)
 *   mes=YYYY-MM             month column
 *
 * Returns { transacciones: TransaccionAuxiliar[] } sorted by fecha asc.
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface Params { empresaId: string; archivoId: string }

export async function GET(req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { empresaId, archivoId } = await params
  const url = new URL(req.url)

  const cuentasParam = url.searchParams.get("cuentas")
  const mes          = url.searchParams.get("mes")

  if (!cuentasParam || !mes) {
    return NextResponse.json({ error: "Parámetros cuentas y mes requeridos" }, { status: 400 })
  }

  // Verify the archive belongs to this empresa
  const archivo = await prisma.estadoResultadosArchivo.findUnique({
    where: { id: archivoId },
    select: { empresaId: true },
  })
  if (!archivo || archivo.empresaId !== empresaId) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  }

  const cuentas = cuentasParam.split(",").map(c => c.trim()).filter(Boolean)

  const transacciones = await prisma.transaccionAuxiliar.findMany({
    where: {
      archivoId,
      mes,
      codigo: { in: cuentas },
    },
    select: {
      id:       true,
      codigo:   true,
      concepto: true,
      fecha:    true,
      nota:     true,
      debito:   true,
      credito:  true,
    },
    orderBy: [
      { fecha: "asc" },
      { id:    "asc" },
    ],
  })

  return NextResponse.json({ transacciones })
}
