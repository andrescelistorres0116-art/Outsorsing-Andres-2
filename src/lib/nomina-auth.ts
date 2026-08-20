import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@prisma/client"
import { NextResponse } from "next/server"
import { headers } from "next/headers"

export type NominaSession = {
  userId: string
  role: UserRole
  empresaIds: string[]  // empty array = ADMIN (all access)
}

export async function getNominaSession(): Promise<NominaSession | null> {
  // Development-only auth bypass via X-Dev-User-Id and X-Dev-User-Role headers
  if (process.env.NODE_ENV === "development") {
    const hdrs = await headers()
    const devUserId = hdrs.get("x-dev-user-id")
    const devUserRole = hdrs.get("x-dev-user-role") as UserRole | null
    if (devUserId && devUserRole && Object.values(UserRole).includes(devUserRole)) {
      if (devUserRole === UserRole.ADMIN) {
        return { userId: devUserId, role: devUserRole, empresaIds: [] }
      }
      const rows = await prisma.usuarioEmpresa.findMany({
        where: { userId: devUserId },
        select: { empresaId: true },
      })
      return { userId: devUserId, role: devUserRole, empresaIds: rows.map(r => r.empresaId) }
    }
  }

  const session = await getServerSession(authOptions)
  if (!session?.user) return null

  const userId = (session.user as any).id as string
  const role = (session.user as any).prismaRole as UserRole

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
