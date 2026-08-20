import { NextRequest, NextResponse } from "next/server"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
import { z } from "zod"
import { createHmac } from "crypto"

export const dynamic = "force-dynamic"

// ─── Internal helpers ────────────────────────────────────────────────────────

const JOSE_BASE = process.env.INTERNAL_BASE_URL ?? "http://localhost:3000"

function joseHeaders(): Headers {
  const key = process.env.JOSE_API_KEY
  if (!key) throw new Error("JOSE_API_KEY not configured")
  const h = new Headers()
  h.set("Authorization", `Bearer ${key}`)
  return h
}

async function fetchJose(path: string, params?: Record<string, string | undefined>): Promise<unknown> {
  const url = new URL(`/api/jose/${path}`, JOSE_BASE)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v) url.searchParams.set(k, v)
    }
  }
  const res = await fetch(url.toString(), { headers: joseHeaders() })
  if (!res.ok) throw new Error(`Error consultando /api/jose/${path}: ${res.status}`)
  return res.json()
}

// ─── MCP server factory ──────────────────────────────────────────────────────

function buildServer(): McpServer {
  const server = new McpServer({
    name: "orbita-ac",
    version: "1.0.0",
  })

  server.tool(
    "get_dashboard",
    "Obtiene el resumen ejecutivo del despacho contable: empresas activas, empresas con nómina, " +
      "obligaciones tributarias vencidas, cuántas vencen en los próximos 5 días, y porcentaje de " +
      "cumplimiento general. Útil para una vista rápida del estado del portafolio.",
    async () => {
      const data = await fetchJose("dashboard")
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] }
    }
  )

  server.tool(
    "get_empresas",
    "Lista todas las empresas del portafolio con su información básica: razón social, NIT, " +
      "régimen tributario, estado (activa/inactiva), ciudad, correo, teléfono, si tienen nómina, " +
      "si son obligadas a facturar y si son agentes retenedores. No incluye contraseñas ni credenciales.",
    async () => {
      const data = await fetchJose("empresas")
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] }
    }
  )

  server.tool(
    "get_calendario_tributario",
    "Consulta el calendario de obligaciones tributarias. Por defecto devuelve las de los próximos 30 días. " +
      "Permite filtrar por empresa, rango de fechas y estado. Devuelve: fecha de vencimiento, tipo de " +
      "obligación, periodicidad, período formateado y estado actual de cada obligación.",
    {
      empresa_id: z
        .string()
        .optional()
        .describe("ID interno de la empresa. Omitir para ver todas las empresas."),
      desde: z
        .string()
        .optional()
        .describe("Fecha inicio en formato YYYY-MM-DD (por defecto: hoy)"),
      hasta: z
        .string()
        .optional()
        .describe("Fecha fin en formato YYYY-MM-DD (por defecto: hoy + 30 días)"),
      estado: z
        .enum(["pendiente", "en_proceso", "presentado", "pagado", "vencido"])
        .optional()
        .describe("Filtrar por estado de la obligación"),
    },
    async ({ empresa_id, desde, hasta, estado }) => {
      const data = await fetchJose("calendario-tributario", { empresa_id, desde, hasta, estado })
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] }
    }
  )

  server.tool(
    "get_nomina",
    "Consulta el estado de los reportes de nómina. Devuelve los reportes pendientes (borrador o " +
      "enviados para revisión) y los aprobados recientemente, con información del período, empresa, " +
      "número de empleados activos y quién los envió o aprobó.",
    async () => {
      const data = await fetchJose("nomina")
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] }
    }
  )

  return server
}

// ─── Bearer token validation ─────────────────────────────────────────────────

function verifyBearer(request: NextRequest): boolean {
  const secret = process.env.MCP_CLIENT_SECRET
  if (!secret) return false
  const auth = request.headers.get("Authorization") ?? ""
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : ""
  if (!token) return false

  const parts = token.split(".")
  if (parts.length !== 3) return false
  const [header, payload, sig] = parts
  const expected = createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url")
  if (sig !== expected) return false

  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"))
    return !claims.exp || claims.exp >= Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}

function unauthorized(): NextResponse {
  return NextResponse.json(
    { error: "Unauthorized" },
    {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Bearer realm="orbita-ac", error="invalid_token"',
      },
    }
  )
}

// ─── Route handler ────────────────────────────────────────────────────────────

async function handleMcp(request: NextRequest): Promise<Response> {
  if (!verifyBearer(request)) return unauthorized()

  const server = buildServer()
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless — safe for serverless/Railway
  })
  await server.connect(transport)
  return transport.handleRequest(request)
}

export const GET = handleMcp
export const POST = handleMcp
export const DELETE = handleMcp
