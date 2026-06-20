import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// Served at /.well-known/oauth-authorization-server via next.config rewrite
export async function GET(): Promise<NextResponse> {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? ""
  return NextResponse.json(
    {
      issuer: base,
      token_endpoint: `${base}/api/mcp/token`,
      grant_types_supported: ["client_credentials"],
      token_endpoint_auth_methods_supported: ["client_secret_post"],
      scopes_supported: ["mcp"],
      response_types_supported: ["token"],
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
