/**
 * GET  /api/estado-resultados/archivos/[empresaId]
 *   → List all stored uploads for this empresa (id, nombreArchivo, mesesCubiertos, createdAt)
 *
 * POST /api/estado-resultados/archivos/[empresaId]
 *   Body: { archivoBase64, nombreArchivo, softwareContable? }
 *   → Process the Excel, compute the EstadoResultados, persist it, return it.
 *
 * DELETE /api/estado-resultados/archivos/[empresaId]?id=xxx
 *   → Remove one stored upload.
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { parseWorldOffice } from "@/lib/estado-resultados/parser-world-office"
import { calcularEstadoResultados } from "@/lib/estado-resultados/calculator"

interface Params { empresaId: string }

function unauth() {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 })
}

// ─── GET: list ────────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return unauth()

  const { empresaId } = await params

  const archivos = await prisma.estadoResultadosArchivo.findMany({
    where: { empresaId },
    select: {
      id: true,
      nombreArchivo: true,
      mesesCubiertos: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ archivos })
}

// ─── POST: process + persist ──────────────────────────────────────────────────

export async function POST(req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return unauth()

  const { empresaId } = await params

  let body: { archivoBase64?: string; nombreArchivo?: string; softwareContable?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const { archivoBase64, nombreArchivo = "archivo.xlsx", softwareContable } = body
  if (!archivoBase64) {
    return NextResponse.json({ error: "archivoBase64 requerido" }, { status: 400 })
  }

  // Fetch empresa + exceptions
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { id: true, softwareContable: true },
  })
  if (!empresa) {
    return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })
  }

  const sw = softwareContable ?? empresa.softwareContable ?? "world_office"
  if (sw !== "world_office") {
    return NextResponse.json(
      { error: `Software "${sw}" no soportado aún. Solo World Office está disponible.` },
      { status: 400 }
    )
  }

  const excepcionesDb = await prisma.estadoResultadosExcepcion.findMany({
    where: { empresaId },
    select: { prefijoCuenta: true, categoriaDestino: true },
  })
  const excepciones = excepcionesDb.map(e => ({
    prefijoCuenta:    e.prefijoCuenta,
    categoriaDestino: e.categoriaDestino as any,
  }))

  try {
    const libro           = parseWorldOffice(archivoBase64)
    const estadoResultados = calcularEstadoResultados(libro, excepciones)

    // Persist
    const archivo = await prisma.estadoResultadosArchivo.create({
      data: {
        empresaId,
        nombreArchivo,
        mesesCubiertos: estadoResultados.meses,
        resultado:      estadoResultados as any,
      },
      select: {
        id: true,
        nombreArchivo: true,
        mesesCubiertos: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ ok: true, archivo, estadoResultados })
  } catch (err: any) {
    console.error("[archivos/POST] Error:", err)
    return NextResponse.json({ error: err?.message ?? "Error procesando el archivo" }, { status: 500 })
  }
}

// ─── DELETE: remove one upload ────────────────────────────────────────────────

export async function DELETE(req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return unauth()

  const { empresaId } = await params
  const id = new URL(req.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 })

  const existing = await prisma.estadoResultadosArchivo.findUnique({
    where: { id },
    select: { empresaId: true },
  })
  if (!existing || existing.empresaId !== empresaId) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  }

  await prisma.estadoResultadosArchivo.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
