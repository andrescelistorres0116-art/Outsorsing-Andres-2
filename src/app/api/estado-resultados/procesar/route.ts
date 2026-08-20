/**
 * POST /api/estado-resultados/procesar
 *
 * Receives a base64-encoded Excel file (World Office Libro Auxiliar),
 * parses it, applies PUC classification (with per-empresa exceptions),
 * and returns the computed EstadoResultados JSON.
 *
 * Body: ProcesarRequest
 * Response: ProcesarResponse
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { parseWorldOffice } from "@/lib/estado-resultados/parser-world-office"
import { calcularEstadoResultados } from "@/lib/estado-resultados/calculator"
import type { ProcesarRequest } from "@/lib/estado-resultados/types"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 })
  }

  let body: ProcesarRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 })
  }

  const { empresaId, archivoBase64, nombreArchivo, softwareContable } = body

  if (!empresaId || !archivoBase64) {
    return NextResponse.json(
      { ok: false, error: "empresaId y archivoBase64 son requeridos" },
      { status: 400 }
    )
  }

  // Validate empresa access
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { id: true, razonSocial: true, softwareContable: true },
  })
  if (!empresa) {
    return NextResponse.json({ ok: false, error: "Empresa no encontrada" }, { status: 404 })
  }

  // Fetch classification exceptions for this empresa
  const excepcionesDb = await prisma.estadoResultadosExcepcion.findMany({
    where: { empresaId },
    select: { prefijoCuenta: true, categoriaDestino: true },
  })

  const excepciones = excepcionesDb.map(e => ({
    prefijoCuenta:    e.prefijoCuenta,
    categoriaDestino: e.categoriaDestino as any,
  }))

  try {
    // Determine parser based on softwareContable
    const sw = softwareContable ?? empresa.softwareContable ?? "world_office"
    if (sw !== "world_office") {
      return NextResponse.json(
        { ok: false, error: `Software contable "${sw}" no soportado aún. Por el momento solo se soporta World Office.` },
        { status: 400 }
      )
    }

    const libro = parseWorldOffice(archivoBase64)
    const estadoResultados = calcularEstadoResultados(libro, excepciones)

    return NextResponse.json({ ok: true, estadoResultados })
  } catch (err: any) {
    console.error("[estado-resultados/procesar] Error:", err)
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Error procesando el archivo" },
      { status: 500 }
    )
  }
}
