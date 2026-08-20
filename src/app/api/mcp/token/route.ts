import { NextRequest, NextResponse } from "next/server"
import { createHmac, createHash } from "crypto"
import { consumeCode } from "@/lib/mcp-codes"

export const dynamic = "force-dynamic"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateToken(clientId: string, secret: string): string {
  const header = Buffer.from(JSON.stringify({ typ: "JWT", alg: "HS256" })).toString("base64url")
  const now = Math.floor(Date.now() / 1000)
  const payload = Buffer.from(
    JSON.stringify({ sub: clientId, iat: now, exp: now + 3600, scope: "mcp" })
  ).toString("base64url")
  const sig = createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url")
  return `${header}.${payload}.${sig}`
}

function verifyPKCE(codeVerifier: string, codeChallenge: string): boolean {
  const computed = createHash("sha256").update(codeVerifier).digest("base64url")
  return computed === codeChallenge
}

async function parseBody(request: NextRequest): Promise<Record<string, string>> {
  const ct = request.headers.get("content-type") ?? ""
  if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
    const form = await request.formData()
    const out: Record<string, string> = {}
    for (const [k, v] of form.entries()) {
      if (typeof v === "string") out[k] = v
    }
    return out
  }
  try {
    return (await request.json()) as Record<string, string>
  } catch {
    return {}
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  const expectedId = process.env.MCP_CLIENT_ID
  const expectedSecret = process.env.MCP_CLIENT_SECRET

  // TEMP DIAGNOSTIC — remove after confirming env vars are visible in Railway
  console.log("[mcp/token] MCP env keys visible:", JSON.stringify(
    Object.keys(process.env).filter(k => k.includes("MCP"))
  ))
  console.log("[mcp/token] MCP_CLIENT_ID present:", !!expectedId, "| MCP_CLIENT_SECRET present:", !!expectedSecret)

  if (!expectedId || !expectedSecret) {
    return NextResponse.json(
      { error: "server_error", error_description: "MCP credentials not configured" },
      { status: 500 }
    )
  }

  const body = await parseBody(request)
  const { grant_type, client_id, client_secret, code, code_verifier } = body

  // Validate client_id (required for all grant types)
  if (!client_id || client_id !== expectedId) {
    return NextResponse.json({ error: "invalid_client" }, { status: 401 })
  }

  // ── authorization_code + PKCE ─────────────────────────────────────────────

  if (grant_type === "authorization_code") {
    // client_secret optional for PKCE public clients; if present must match
    if (client_secret && client_secret !== expectedSecret) {
      return NextResponse.json({ error: "invalid_client" }, { status: 401 })
    }

    if (!code || !code_verifier) {
      return NextResponse.json(
        { error: "invalid_request", error_description: "code and code_verifier are required" },
        { status: 400 }
      )
    }

    const entry = consumeCode(code)
    if (!entry) {
      return NextResponse.json(
        { error: "invalid_grant", error_description: "Authorization code expired or already used" },
        { status: 400 }
      )
    }

    if (entry.clientId !== client_id) {
      return NextResponse.json({ error: "invalid_grant" }, { status: 400 })
    }

    if (!verifyPKCE(code_verifier, entry.codeChallenge)) {
      return NextResponse.json(
        { error: "invalid_grant", error_description: "PKCE code_verifier does not match" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      access_token: generateToken(client_id, expectedSecret),
      token_type: "Bearer",
      expires_in: 3600,
      scope: "mcp",
    })
  }

  // ── client_credentials ────────────────────────────────────────────────────

  if (grant_type === "client_credentials") {
    if (!client_secret || client_secret !== expectedSecret) {
      return NextResponse.json({ error: "invalid_client" }, { status: 401 })
    }

    return NextResponse.json({
      access_token: generateToken(client_id, expectedSecret),
      token_type: "Bearer",
      expires_in: 3600,
      scope: "mcp",
    })
  }

  return NextResponse.json(
    {
      error: "unsupported_grant_type",
      error_description: "Supported grant types: authorization_code, client_credentials",
    },
    { status: 400 }
  )
}
