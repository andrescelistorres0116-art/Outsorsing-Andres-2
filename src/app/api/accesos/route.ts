import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// ─── Encryption helpers ───────────────────────────────────────────────────────

function encryptPassword(password: string): string {
  const key = process.env.ENCRYPTION_KEY || "default-key"
  // XOR each byte with the key bytes (cycling), then base64-encode
  const keyBytes = Buffer.from(key)
  const passBytes = Buffer.from(password, "utf-8")
  const result = Buffer.alloc(passBytes.length)
  for (let i = 0; i < passBytes.length; i++) {
    result[i] = passBytes[i] ^ keyBytes[i % keyBytes.length]
  }
  return result.toString("base64")
}

function decryptPassword(encrypted: string): string {
  const key = process.env.ENCRYPTION_KEY || "default-key"
  const keyBytes = Buffer.from(key)
  const encBytes = Buffer.from(encrypted, "base64")
  const result = Buffer.alloc(encBytes.length)
  for (let i = 0; i < encBytes.length; i++) {
    result[i] = encBytes[i] ^ keyBytes[i % keyBytes.length]
  }
  return result.toString("utf-8")
}

// Export for use by the [id] route
export { encryptPassword, decryptPassword }

// ─── GET /api/accesos ─────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
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
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          empresaId: true,
          tipo: true,
          plataforma: true,
          usuario: true,
          // contrasena intentionally excluded from list view
          correoAsociado: true,
          municipio: true,
          tags: true,
          observaciones: true,
          createdAt: true,
          updatedAt: true,
          empresa: {
            select: {
              id: true,
              razonSocial: true,
              nit: true,
            },
          },
        },
      }),
      prisma.acceso.count({ where }),
    ])

    // Return masked password indicator in list
    const masked = accesos.map((a) => ({
      ...a,
      contrasena: "••••••",
    }))

    return NextResponse.json({ accesos: masked, total, page, limit })
  } catch (error) {
    console.error("Error fetching accesos:", error)
    return NextResponse.json({ error: "Error fetching accesos" }, { status: 500 })
  }
}

// ─── POST /api/accesos ────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    if (!data.empresaId || !data.tipo) {
      return NextResponse.json(
        { error: "empresaId and tipo are required" },
        { status: 400 }
      )
    }

    // Encrypt password before storing
    if (data.contrasena) {
      data.contrasena = encryptPassword(data.contrasena)
    }

    const acceso = await prisma.acceso.create({
      data,
      include: {
        empresa: {
          select: {
            id: true,
            razonSocial: true,
            nit: true,
          },
        },
      },
    })

    // Return with masked password
    return NextResponse.json(
      { ...acceso, contrasena: acceso.contrasena ? "••••••" : null },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error creating acceso:", error)
    if (error?.code === "P2003") {
      return NextResponse.json(
        { error: "Referenced empresa does not exist" },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: "Error creating acceso" }, { status: 500 })
  }
}
