import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const SESSION_KEY = "app-session"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always allow: login page, auth API, static assets
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/")
  ) {
    return NextResponse.next()
  }

  // Protect all other routes by checking our session cookie
  const hasSession = request.cookies.has(SESSION_KEY)

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)",
  ],
}
