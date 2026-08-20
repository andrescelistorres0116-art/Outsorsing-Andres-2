"use client"
import { useSession, signOut as nextAuthSignOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import type { AppRole } from "@/lib/auth"

export type AppSession = {
  userId: string
  nombre: string
  email: string
  role: AppRole
  empresaIds: string[]
}

export function useAppSession() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const appSession: AppSession | null = session?.user
    ? {
        userId: (session.user as any).id,
        nombre: session.user.name ?? "",
        email: session.user.email ?? "",
        role: (session.user as any).role as AppRole,
        empresaIds: (session.user as any).empresaIds ?? [],
      }
    : null

  const signOut = async () => {
    await nextAuthSignOut({ redirect: false })
    window.location.href = "/login"
  }

  return {
    appSession,
    status, // "loading" | "authenticated" | "unauthenticated"
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    signOut,
  }
}
