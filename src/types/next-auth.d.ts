import { DefaultSession, DefaultUser } from "next-auth"
import { JWT } from "next-auth/jwt"
import { AppRole } from "@/lib/auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: AppRole
      prismaRole: string
      empresaIds: string[]
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role: AppRole
    prismaRole: string
    empresaIds: string[]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: AppRole
    prismaRole?: string
    empresaIds?: string[]
  }
}
