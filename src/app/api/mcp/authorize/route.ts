import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { randomBytes } from "crypto"
import { storeCode } from "@/lib/mcp-codes"
import { publicOrigin } from "@/lib/public-origin"

export const dynamic = "force-dynamic"

const CODE_TTL_MS = 60_000 // codes expire after 60 seconds

function redirectError(
  redirectUri: string | null,
  state: string,
  error: string,
  description?: string
): NextResponse {
  if (!redirectUri) {
    return NextResponse.json({ error, error_description: description }, { status: 400 })
  }
  const url = new URL(redirectUri)
  url.searchParams.set("error", error)
  if (state) url.searchParams.set("state", state)
  if (description) url.searchParams.set("error_description", description)
  return NextResponse.redirect(url)
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  // Rebuild the full authorize URL using the public origin so that the login
  // callbackUrl points to the Railway domain, not the internal 0.0.0.0:PORT.
  const origin = publicOrigin(request)
  const publicHref = `${origin}${request.nextUrl.pathname}${request.nextUrl.search}`

  const responseType = searchParams.get("response_type")
  const clientId = searchParams.get("client_id")
  const redirectUri = searchParams.get("redirect_uri")
  const state = searchParams.get("state") ?? ""
  const codeChallenge = searchParams.get("code_challenge")
  const codeChallengeMethod = searchParams.get("code_challenge_method") ?? "S256"

  // ── Validate parameters ─────────────────────────────────────────────────────

  if (responseType !== "code") {
    return redirectError(redirectUri, state, "unsupported_response_type")
  }

  const expectedClientId = process.env.MCP_CLIENT_ID
  if (!expectedClientId || clientId !== expectedClientId) {
    return redirectError(redirectUri, state, "unauthorized_client", "Unknown client_id")
  }

  if (!redirectUri) {
    return NextResponse.json({ error: "invalid_request", error_description: "redirect_uri required" }, { status: 400 })
  }

  if (!codeChallenge) {
    return redirectError(redirectUri, state, "invalid_request", "code_challenge required (PKCE)")
  }

  if (codeChallengeMethod !== "S256") {
    return redirectError(redirectUri, state, "invalid_request", "Only code_challenge_method=S256 is supported")
  }

  // ── Check user session ──────────────────────────────────────────────────────

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  if (!token) {
    // No session — redirect to the app's login page using the public origin.
    // After login, NextAuth bounces back to this authorize URL (also public).
    const loginUrl = new URL("/login", origin)
    loginUrl.searchParams.set("callbackUrl", publicHref)
    return NextResponse.redirect(loginUrl)
  }

  // ── Issue authorization code ────────────────────────────────────────────────

  const code = randomBytes(32).toString("base64url")

  storeCode(code, {
    codeChallenge,
    codeChallengeMethod,
    clientId,
    redirectUri,
    expiresAt: Date.now() + CODE_TTL_MS,
  })

  const callback = new URL(redirectUri)
  callback.searchParams.set("code", code)
  if (state) callback.searchParams.set("state", state)

  return NextResponse.redirect(callback)
}
