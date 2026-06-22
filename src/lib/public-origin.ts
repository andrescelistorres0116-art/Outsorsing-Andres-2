import type { NextRequest } from "next/server"

/**
 * Returns the public-facing origin of the app.
 *
 * Priority:
 *  1. NEXT_PUBLIC_BASE_URL env var (explicit override, recommended for Railway)
 *  2. x-forwarded-proto + x-forwarded-host headers (set by Railway's reverse proxy)
 *  3. Fallback to whatever Next.js gives us in request.url
 *
 * Safe to use in both Edge (middleware/proxy.ts) and Node.js route handlers.
 */
export function publicOrigin(request: NextRequest): string {
  const env = (process.env.NEXT_PUBLIC_BASE_URL ?? "").trim().replace(/\/$/, "")
  if (env) return env

  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ??
    (request.url.startsWith("https") ? "https" : "http")
  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ??
    request.headers.get("host") ??
    ""

  return `${proto}://${host}`
}
