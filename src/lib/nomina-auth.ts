import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@prisma/client"
import { NextResponse } from "next/server"

export type NominaSession = {
  userId: string
  role: UserRole
  empresaIds: string[]  // empty array = ADMIN (all access)
}

export async function getNominaSession(): Promise<NominaSession | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null

  const userId = (session.user as any).id as string
  const role = (session.user as any).role as UserRole

  if (role === UserRole.ADMIN) {
    return { userId, role, empresaIds: [] }
  }

  const rows = await prisma.usuarioEmpresa.findMany({
    where: { userId },
    select: { empresaId: true },
  })

  return { userId, role, empresaIds: rows.map(r => r.empresaId) }
}

export function canAccess(session: NominaSession, empresaId: string): boolean {
  if (session.role === UserRole.ADMIN) return true
  return session.empresaIds.includes(empresaId)
}

export function isContador(session: NominaSession): boolean {
  return session.role === UserRole.ADMIN || session.role === UserRole.ANALYST || session.role === UserRole.NOMINA
}

export function isCliente(session: NominaSession): boolean {
  return session.role === UserRole.CLIENT
}

export function isAdmin(session: NominaSession): boolean {
  return session.role === UserRole.ADMIN
}

export function unauthorized(msg = "No autorizado") {
  return NextResponse.json({ error: msg }, { status: 401 })
}

export function forbidden(msg = "Sin permisos para esta empresa") {
  return NextResponse.json({ error: msg }, { status: 403 })
}
