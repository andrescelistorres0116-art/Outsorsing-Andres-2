/**
 * GET    /api/estado-resultados/catalogo/[empresaId]
 *   → { hasCatalogo: boolean, totalCuentas: number }
 *
 * POST   /api/estado-resultados/catalogo/[empresaId]
 *   Body: { archivoBase64: string }
 *   → { ok: true, totalCuentas: number }
 *   Replaces any existing catalog for this empresa.
 *
 * DELETE /api/estado-resultados/catalogo/[empresaId]
 *   → { ok: true }
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { parseCatalogoExcel } from "@/lib/estado-resultados/catalogo"

interface Params { empresaId: string }

function unauth() {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 })
}

// ─── GET: status ──────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return unauth()

  const { empresaId } = await params
  const totalCuentas = await prisma.catalogoCuenta.count({ where: { empresaId } })

  return NextResponse.json({ hasCatalogo: totalCuentas > 0, totalCuentas })
}

// ─── POST: import ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return unauth()

  const { empresaId } = await params

  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { id: true },
  })
  if (!empresa) return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })

  let body: { archivoBase64?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  if (!body.archivoBase64) {
    return NextResponse.json({ error: "archivoBase64 requerido" }, { status: 400 })
  }

  try {
    const entries = parseCatalogoExcel(body.archivoBase64)

    // Replace catalog atomically
    await prisma.$transaction(async tx => {
      await tx.catalogoCuenta.deleteMany({ where: { empresaId } })

      const BATCH = 500
      for (let i = 0; i < entries.length; i += BATCH) {
        await tx.catalogoCuenta.createMany({
          data: entries.slice(i, i + BATCH).map(e => ({
            empresaId,
            codigo:   e.codigo,
            nombre:   e.nombre,
            tipo:     e.tipo,
            grupo:    e.grupo,
            inactivo: e.inactivo,
          })),
          skipDuplicates: true,
        })
      }
    })

    return NextResponse.json({ ok: true, totalCuentas: entries.length })
  } catch (err: any) {
    console.error("[catalogo/POST] Error:", err)
    return NextResponse.json(
      { error: err?.message ?? "Error procesando el catálogo" },
      { status: 500 }
    )
  }
}

// ─── DELETE: remove catalog ───────────────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return unauth()

  const { empresaId } = await params
  await prisma.catalogoCuenta.deleteMany({ where: { empresaId } })
  return NextResponse.json({ ok: true })
}
