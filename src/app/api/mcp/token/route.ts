import { NextRequest, NextResponse } from "next/server"
import { createHmac } from "crypto"

export const dynamic = "force-dynamic"

function generateToken(clientId: string, secret: string): string {
  const header = Buffer.from(JSON.stringify({ typ: "JWT", alg: "HS256" })).toString("base64url")
  const now = Math.floor(Date.now() / 1000)
  const payload = Buffer.from(
    JSON.stringify({ sub: clientId, iat: now, exp: now + 3600, scope: "mcp" })
  ).toString("base64url")
  const sig = createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url")
  return `${header}.${payload}.${sig}`
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const expectedId = process.env.MCP_CLIENT_ID
  const expectedSecret = process.env.MCP_CLIENT_SECRET

  if (!expectedId || !expectedSecret) {
    return NextResponse.json(
      { error: "server_error", error_description: "MCP credentials not configured" },
      { status: 500 }
    )
  }

  let clientId: string | null = null
  let clientSecret: string | null = null
  let grantType: string | null = null

  const ct = request.headers.get("content-type") ?? ""
  if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
    const form = await request.formData()
    clientId = (form.get("client_id") as string | null)
    clientSecret = (form.get("client_secret") as string | null)
    grantType = (form.get("grant_type") as string | null)
  } else {
    try {
      const body = await request.json()
      clientId = body.client_id ?? null
      clientSecret = body.client_secret ?? null
      grantType = body.grant_type ?? null
    } catch {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 })
    }
  }

  if (grantType !== "client_credentials") {
    return NextResponse.json(
      { error: "unsupported_grant_type", error_description: "Only client_credentials is supported" },
      { status: 400 }
    )
  }

  if (clientId !== expectedId || clientSecret !== expectedSecret) {
    return NextResponse.json({ error: "invalid_client" }, { status: 401 })
  }

  return NextResponse.json({
    access_token: generateToken(clientId, expectedSecret),
    token_type: "Bearer",
    expires_in: 3600,
    scope: "mcp",
  })
}
