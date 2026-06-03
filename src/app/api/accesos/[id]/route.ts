import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// ─── Encryption helpers (duplicated to avoid cross-route import issues) ───────

function encryptPassword(password: string): string {
  const key = process.env.ENCRYPTION_KEY || "default-key"
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

// ─── GET /api/accesos/[id] ────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const reveal = searchParams.get("reveal") === "true"

    const acceso = await prisma.acceso.findUnique({
      where: { id: params.id },
      include: {
        empresa: {
          select: {
            id: true,
            razonSocial: true,
            nit: true,
            nombreComercial: true,
          },
        },
        logAccesos: {
          orderBy: { timestamp: "desc" },
          take: 10,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!acceso) {
      return NextResponse.json({ error: "Acceso not found" }, { status: 404 })
    }

    if (reveal && acceso.contrasena) {
      // Decrypt and log the reveal event
      const decrypted = decryptPassword(acceso.contrasena)

      // Log who revealed the password (best-effort — no hard failure if session missing)
      try {
        const session = await getServerSession(authOptions)
        if (session?.user) {
          await prisma.logAcceso.create({
            data: {
              accesoId: acceso.id,
              userId: (session.user as any).id,
              accion: "REVEAL_PASSWORD",
            },
          })
        }
      } catch {
        // Non-fatal — continue even if logging fails
      }

      return NextResponse.json({ ...acceso, contrasena: decrypted })
    }

    // Default: mask the password
    return NextResponse.json({
      ...acceso,
      contrasena: acceso.contrasena ? "••••••" : null,
    })
  } catch (error) {
    console.error("Error fetching acceso:", error)
    return NextResponse.json({ error: "Error fetching acceso" }, { status: 500 })
  }
}

// ─── PUT /api/accesos/[id] ────────────────────────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()

    delete data.id
    delete data.createdAt
    delete data.empresaId

    // Re-encrypt if password is being updated (only if it's a plain string, not the mask)
    if (data.contrasena && data.contrasena !== "••••••") {
      data.contrasena = encryptPassword(data.contrasena)
    } else if (data.contrasena === "••••••") {
      delete data.contrasena // keep existing encrypted value
    }

    const acceso = await prisma.acceso.update({
      where: { id: params.id },
      data,
    })

    return NextResponse.json({ ...acceso, contrasena: acceso.contrasena ? "••••••" : null })
  } catch (error: any) {
    console.error("Error updating acceso:", error)
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Acceso not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Error updating acceso" }, { status: 500 })
  }
}

// ─── DELETE /api/accesos/[id] ─────────────────────────────────────────────────

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.acceso.delete({ where: { id: params.id } })
    return NextResponse.json({ message: "Acceso deleted" })
  } catch (error: any) {
    console.error("Error deleting acceso:", error)
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Acceso not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Error deleting acceso" }, { status: 500 })
  }
}
