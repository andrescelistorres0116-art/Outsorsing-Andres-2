import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { encrypt, decrypt } from "@/lib/crypto"

// encrypt / decrypt re-exported so [id]/route.ts can import from one place
export { encrypt as encryptPassword, decrypt as decryptPassword }

function mapAcceso(a: any) {
  return {
    id: a.id,
    empresaId: a.empresaId,
    empresa: a.empresa?.razonSocial ?? "",
    tipo: a.tipo,
    plataforma: a.plataforma ?? "",
    usuario: a.usuario ?? "",
    contrasena: "••••••",
    correoAsociado: a.correoAsociado ?? undefined,
    tags: a.tags ?? [],
    observaciones: a.observaciones ?? undefined,
    archivado: a.archivado ?? false,
    ultimoAcceso: a.ultimoAcceso
      ? new Date(a.ultimoAcceso).toISOString().split("T")[0]
      : new Date(a.updatedAt ?? a.createdAt).toISOString().split("T")[0],
    nitTercero: a.nitTercero ?? undefined,
    tipoDocumento: a.tipoDocumento ?? undefined,
    nitEmpresa: a.nitEmpresa ?? undefined,
    nombreSoftware: a.nombreSoftware ?? undefined,
  }
}

// ─── GET /api/accesos?all=1 → array plano para la página de accesos ───────────
// ─── GET /api/accesos → paginado (uso interno/admin) ─────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Mode "all": retorna array directo con todos los campos que necesita la página
    if (searchParams.get("all") === "1") {
      const accesos = await prisma.acceso.findMany({
        orderBy: { createdAt: "desc" },
        include: { empresa: { select: { id: true, razonSocial: true } } },
      })
      return NextResponse.json(accesos.map(mapAcceso))
    }

    // Modo paginado (legacy)
    const empresaId = searchParams.get("empresaId") || undefined
    const tipo = searchParams.get("tipo") || undefined
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const where: any = {
      ...(empresaId ? { empresaId } : {}),
      ...(tipo ? { tipo: tipo as any } : {}),
    }
    const [accesos, total] = await Promise.all([
      prisma.acceso.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { createdAt: "desc" },
        include: { empresa: { select: { id: true, razonSocial: true } } },
      }),
      prisma.acceso.count({ where }),
    ])
    return NextResponse.json({ accesos: accesos.map(mapAcceso), total, page, limit })
  } catch (error) {
    console.error("Error fetching accesos:", error)
    return NextResponse.json({ error: "Error fetching accesos" }, { status: 500 })
  }
}

// ─── POST /api/accesos ────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { empresaNombre, ...data } = body

    // Resolver empresaId desde el nombre si no viene directamente
    if (!data.empresaId && empresaNombre) {
      const emp = await prisma.empresa.findFirst({
        where: { razonSocial: { equals: empresaNombre, mode: "insensitive" } },
        select: { id: true },
      })
      if (!emp) return NextResponse.json({ error: "Empresa no encontrada" }, { status: 400 })
      data.empresaId = emp.id
    }

    if (!data.empresaId || !data.tipo) {
      return NextResponse.json({ error: "empresaId y tipo son requeridos" }, { status: 400 })
    }

    if (data.contrasena && data.contrasena !== "••••••") {
      data.contrasena = encrypt(data.contrasena)
    }

    // Quitar campos que no existen en el modelo
    delete data.empresa

    const acceso = await prisma.acceso.create({
      data,
      include: { empresa: { select: { id: true, razonSocial: true } } },
    })

    return NextResponse.json(mapAcceso(acceso), { status: 201 })
  } catch (error: any) {
    console.error("Error creating acceso:", error)
    if (error?.code === "P2003") {
      return NextResponse.json({ error: "La empresa referenciada no existe" }, { status: 400 })
    }
    return NextResponse.json({ error: "Error al crear el acceso" }, { status: 500 })
  }
}
