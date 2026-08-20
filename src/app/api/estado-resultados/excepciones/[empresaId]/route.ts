/**
 * GET  /api/estado-resultados/excepciones/[empresaId]  → list
 * POST /api/estado-resultados/excepciones/[empresaId]  → create
 * PUT  /api/estado-resultados/excepciones/[empresaId]  → update  (body: { id, ... })
 * DELETE /api/estado-resultados/excepciones/[empresaId]?id=xxx → delete
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface Params { empresaId: string }

function unauthorized() {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return unauthorized()

  const { empresaId } = await params
  const excepciones = await prisma.estadoResultadosExcepcion.findMany({
    where: { empresaId },
    orderBy: { prefijoCuenta: "asc" },
  })
  return NextResponse.json({ excepciones })
}

export async function POST(req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return unauthorized()

  const { empresaId } = await params
  const body = await req.json()
  const { prefijoCuenta, categoriaOriginal, categoriaDestino, descripcion } = body

  if (!prefijoCuenta || !categoriaDestino) {
    return NextResponse.json(
      { error: "prefijoCuenta y categoriaDestino son requeridos" },
      { status: 400 }
    )
  }

  const excepcion = await prisma.estadoResultadosExcepcion.upsert({
    where: { empresaId_prefijoCuenta: { empresaId, prefijoCuenta } },
    update: { categoriaOriginal: categoriaOriginal ?? null, categoriaDestino, descripcion: descripcion ?? null },
    create: { empresaId, prefijoCuenta, categoriaOriginal: categoriaOriginal ?? null, categoriaDestino, descripcion: descripcion ?? null },
  })
  return NextResponse.json({ excepcion })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return unauthorized()

  const { empresaId } = await params
  const body = await req.json()
  const { id, categoriaDestino, descripcion } = body

  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 })

  const excepcion = await prisma.estadoResultadosExcepcion.update({
    where: { id },
    data: { categoriaDestino, descripcion: descripcion ?? null },
  })
  // Ensure it belongs to this empresa
  if (excepcion.empresaId !== empresaId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }
  return NextResponse.json({ excepcion })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return unauthorized()

  const { empresaId } = await params
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 })

  const existing = await prisma.estadoResultadosExcepcion.findUnique({ where: { id } })
  if (!existing || existing.empresaId !== empresaId) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  }

  await prisma.estadoResultadosExcepcion.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
