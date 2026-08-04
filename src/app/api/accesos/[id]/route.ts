import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { encrypt as encryptPassword, decrypt as decryptPassword } from "@/lib/crypto"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const reveal = searchParams.get("reveal") === "true"

    const acceso = await prisma.acceso.findUnique({
      where: { id },
      include: {
        empresa: { select: { id: true, razonSocial: true, nit: true, nombreComercial: true } },
        logAccesos: {
          orderBy: { timestamp: "desc" },
          take: 10,
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    })

    if (!acceso) return NextResponse.json({ error: "Acceso not found" }, { status: 404 })

    if (reveal && acceso.contrasena) {
      const decrypted = decryptPassword(acceso.contrasena)
      try {
        const session = await getServerSession(authOptions)
        if (session?.user) {
          await prisma.logAcceso.create({
            data: { accesoId: acceso.id, userId: (session.user as any).id, accion: "REVEAL_PASSWORD" },
          })
        }
      } catch {}
      return NextResponse.json({ ...acceso, contrasena: decrypted })
    }

    return NextResponse.json({ ...acceso, contrasena: acceso.contrasena ? "••••••" : null })
  } catch {
    return NextResponse.json({ error: "Error fetching acceso" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const data = await request.json()
    delete data.id
    delete data.createdAt
    delete data.empresaId

    if (data.contrasena && data.contrasena !== "••••••") {
      data.contrasena = encryptPassword(data.contrasena)
    } else if (data.contrasena === "••••••") {
      delete data.contrasena
    }

    const acceso = await prisma.acceso.update({ where: { id }, data })
    return NextResponse.json({ ...acceso, contrasena: acceso.contrasena ? "••••••" : null })
  } catch (error: any) {
    if (error?.code === "P2025") return NextResponse.json({ error: "Acceso not found" }, { status: 404 })
    return NextResponse.json({ error: "Error updating acceso" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    await prisma.acceso.delete({ where: { id } })
    return NextResponse.json({ message: "Acceso deleted" })
  } catch (error: any) {
    if (error?.code === "P2025") return NextResponse.json({ error: "Acceso not found" }, { status: 404 })
    return NextResponse.json({ error: "Error deleting acceso" }, { status: 500 })
  }
}
