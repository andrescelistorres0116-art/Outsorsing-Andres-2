import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"
import { UserRole } from "@prisma/client"

export type AppRole = "admin" | "contador" | "cliente"

export function mapRole(role: UserRole): AppRole {
  if (role === UserRole.ADMIN) return "admin"
  if (role === UserRole.CLIENT) return "cliente"
  return "contador" // ANALYST, NOMINA
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findFirst({
          where: { email: credentials.email, isActive: true }
        })
        if (!user) return null

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null

        // Fetch empresaIds
        const asignaciones = await prisma.usuarioEmpresa.findMany({
          where: { userId: user.id },
          select: { empresaId: true }
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          prismaRole: user.role,
          role: mapRole(user.role),
          empresaIds: asignaciones.map(a => a.empresaId),
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.prismaRole = (user as any).prismaRole
        token.empresaIds = (user as any).empresaIds ?? []
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id ?? token.sub
        ;(session.user as any).role = token.role
        ;(session.user as any).prismaRole = token.prismaRole
        ;(session.user as any).empresaIds = token.empresaIds ?? []
      }
      return session
    }
  },
  pages: { signIn: '/login' },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 }, // 8 hours
  secret: process.env.NEXTAUTH_SECRET,
}
