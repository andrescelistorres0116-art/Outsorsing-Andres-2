import { NextRequest, NextResponse } from "next/server"

// In-memory sliding window rate limiter: 60 req/min per IP
const rateMap = new Map<string, { count: number; reset: number }>()

function checkRate(ip: string): boolean {
  const now = Date.now()
  const entry = rateMap.get(ip)
  if (!entry || now > entry.reset) {
    rateMap.set(ip, { count: 1, reset: now + 60_000 })
    return true
  }
  if (entry.count >= 60) return false
  entry.count++
  return true
}

export function joseAuth(request: NextRequest): NextResponse | null {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  if (!checkRate(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded. Max 60 requests/minute." }, { status: 429 })
  }

  const apiKey = process.env.JOSE_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured on server." }, { status: 500 })
  }

  const auth = request.headers.get("Authorization") ?? ""
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : ""
  if (!token || token !== apiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return null // auth passed
}

export function formatFecha(d: Date | string | null | undefined): string {
  if (!d) return ""
  return new Date(d).toISOString().split("T")[0]
}

export function mapEstado(e: string): string {
  return (
    { PENDIENTE: "pendiente", EN_PROCESO: "en_proceso", PRESENTADO: "presentado", PAGADO: "pagado", VENCIDO: "vencido" }[e] ??
    e.toLowerCase()
  )
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

export function formatPeriodo(periodo: number, periodicidad: string, anio: number): string {
  switch (periodicidad) {
    case "QUINCENAL": {
      const mes = Math.ceil(periodo / 2) - 1
      const q = periodo % 2 === 1 ? "Primera" : "Segunda"
      return `${q} quincena de ${MESES[mes] ?? ""} ${anio}`
    }
    case "BIMESTRAL": {
      const b: Record<number, string> = { 1: "Enero–Febrero", 3: "Marzo–Abril", 5: "Mayo–Junio", 7: "Julio–Agosto", 9: "Septiembre–Octubre", 11: "Noviembre–Diciembre" }
      return `${b[periodo] ?? `Bimestre ${periodo}`} ${anio}`
    }
    case "TRIMESTRAL": {
      const t: Record<number, string> = { 1: "Enero–Marzo", 4: "Abril–Junio", 7: "Julio–Septiembre", 10: "Octubre–Diciembre" }
      return `${t[periodo] ?? `Trimestre ${periodo}`} ${anio}`
    }
    case "CUATRIMESTRAL": {
      const c: Record<number, string> = { 1: "Enero–Abril", 5: "Mayo–Agosto", 9: "Septiembre–Diciembre" }
      return `${c[periodo] ?? `Cuatrimestre ${periodo}`} ${anio}`
    }
    case "SEMESTRAL": {
      const s: Record<number, string> = { 1: "Enero–Junio", 7: "Julio–Diciembre" }
      return `${s[periodo] ?? `Semestre ${periodo}`} ${anio}`
    }
    case "ANUAL":
      return `Año ${anio}`
    default:
      return `${MESES[periodo - 1] ?? `Mes ${periodo}`} ${anio}`
  }
}
