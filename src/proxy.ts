import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"

const PUBLIC_PATHS = ["/login", "/api/auth"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Allow static files
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next()
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (!token) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Role-based route protection
  const role = token.role as string

  // Protect admin-only routes
  if (pathname.startsWith("/configuracion") && role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // Clients can only access /nomina
  if (role === "cliente" && !pathname.startsWith("/nomina") && !pathname.startsWith("/api")) {
    return NextResponse.redirect(new URL("/nomina", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
