import { NextRequest, NextResponse } from "next/server"
import { publicOrigin } from "@/lib/public-origin"

export const dynamic = "force-dynamic"

// Served at /.well-known/oauth-authorization-server via next.config rewrite
export async function GET(req: NextRequest): Promise<NextResponse> {
  const base = publicOrigin(req)
  return NextResponse.json(
    {
      issuer: base,
      authorization_endpoint: `${base}/api/mcp/authorize`,
      token_endpoint: `${base}/api/mcp/token`,
      grant_types_supported: ["authorization_code", "client_credentials"],
      response_types_supported: ["code"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["client_secret_post", "none"],
      scopes_supported: ["mcp"],
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
      },
    }
  )
}

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
