/**
 * parser-world-office.ts
 *
 * Parses a World Office "Libro Auxiliar" Excel export into a
 * software-agnostic LibroAuxiliarParsed structure.
 *
 * World Office Libro Auxiliar layout (typical single-sheet export):
 *   – Several header rows at the top (company name, report title, period, etc.)
 *   – Account sections, each consisting of:
 *       1. An account-header row: first cell = account code (digits only)
 *       2. A "SALDO INICIAL" row (or "SALDO ANTERIOR") carrying the
 *          opening balance before the first period in the file.
 *       3. Zero or more transaction rows, each with a date and debit/credit.
 *       4. A "Total …" row (skipped — we recompute from movements).
 *   – The sheet may contain subtotal / group rows (2-digit codes like "41",
 *     "42", "51", etc.) — these are also skipped.
 *
 * Sign convention stored in CuentaMovimientos.saldoInicial:
 *   Positive → debit opening balance
 *   Negative → credit opening balance
 * Monthly debitos/creditos are always positive amounts.
 */

import * as XLSX from "xlsx"
import type { LibroAuxiliarParsed, CuentaMovimientos } from "./types"

// ─── Constants ────────────────────────────────────────────────────────────────

// Excel epoch: day 1 = 1900-01-01 (but Excel incorrectly treats 1900 as leap year)
const EXCEL_EPOCH_MS = new Date(1899, 11, 30).getTime()

// Account codes must be 4-10 pure digits (leaf-level PUC accounts; group rows like "41" are 2-digit)
const LEAF_CODE_RE = /^\d{4,10}$/

// Detect "SALDO INICIAL" / "SALDO ANTERIOR" in any cell of the row
const SALDO_INICIAL_RE = /saldo\s+(inicial|anterior)/i

// Detect "Total …" subtotal rows
const TOTAL_ROW_RE = /^total/i

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convert an Excel serial date or a string date to "YYYY-MM".
 * Returns null if the value cannot be parsed as a date.
 */
function toYYYYMM(raw: unknown): string | null {
  if (raw == null || raw === "") return null

  let date: Date | null = null

  if (typeof raw === "number" && raw > 1000) {
    // Excel serial date: milliseconds from EXCEL_EPOCH_MS
    const ms = Math.round((raw - 1) * 86400000) + EXCEL_EPOCH_MS
    date = new Date(ms)
  } else if (typeof raw === "string") {
    // Try "DD/MM/YYYY", "YYYY-MM-DD", "D/M/YY", etc.
    const cleaned = raw.trim()
    // ISO-ish
    let m = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
    if (m) {
      date = new Date(+m[1], +m[2] - 1, +m[3])
    } else {
      // DD/MM/YYYY or D/M/YYYY (Colombian locale)
      m = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/)
      if (m) {
        const day = +m[1], mon = +m[2]
        let yr = +m[3]
        if (yr < 100) yr += yr < 50 ? 2000 : 1900
        date = new Date(yr, mon - 1, day)
      }
    }
  } else if (raw instanceof Date) {
    date = raw
  }

  if (!date || isNaN(date.getTime())) return null
  const y = date.getFullYear()
  const mo = String(date.getMonth() + 1).padStart(2, "0")
  return `${y}-${mo}`
}

/** Parse a cell value as a float, returning 0 for empties/NaN */
function toFloat(raw: unknown): number {
  if (raw == null || raw === "") return 0
  if (typeof raw === "number") return isNaN(raw) ? 0 : raw
  const n = parseFloat(String(raw).replace(/[,\s]/g, ""))
  return isNaN(n) ? 0 : n
}

/** Return the first non-empty, trimmed string from a row array */
function firstText(row: unknown[]): string {
  for (const cell of row) {
    const s = (cell ?? "").toString().trim()
    if (s) return s
  }
  return ""
}

// ─── Column auto-detection ────────────────────────────────────────────────────

interface ColMap {
  fecha: number    // date column index
  debito: number   // debit column index
  credito: number  // credit column index
  nombre: number   // account-name column index (often col 1)
}

const HEADER_KEYWORDS: Record<keyof ColMap, string[]> = {
  fecha:   ["fecha", "date"],
  debito:  ["débito", "debito", "debe", "debit"],
  credito: ["crédito", "credito", "haber", "credit"],
  nombre:  ["nombre", "descripción", "descripcion", "cuenta", "name"],
}

/**
 * Scan the first `scanRows` rows of the sheet for a header row and return
 * detected column positions. Falls back to a sensible default layout.
 */
function detectColumns(rows: unknown[][], scanRows = 15): ColMap {
  // Default: Cuenta(0), Nombre(1), Fecha(2), Tipo(3), Número(4), Desc(5), Débito(6), Crédito(7), Saldo(8)
  const defaults: ColMap = { nombre: 1, fecha: 2, debito: 6, credito: 7 }

  for (let i = 0; i < Math.min(scanRows, rows.length); i++) {
    const row = rows[i]
    const lower = row.map(c => (c ?? "").toString().toLowerCase().trim())

    const found: Partial<ColMap> = {}
    for (const [key, kws] of Object.entries(HEADER_KEYWORDS) as [keyof ColMap, string[]][]) {
      for (let j = 0; j < lower.length; j++) {
        if (kws.some(kw => lower[j].includes(kw))) {
          found[key] = j
          break
        }
      }
    }

    if (found.fecha !== undefined && found.debito !== undefined && found.credito !== undefined) {
      return {
        fecha:   found.fecha,
        debito:  found.debito,
        credito: found.credito,
        nombre:  found.nombre ?? defaults.nombre,
      }
    }
  }

  return defaults
}

// ─── Row classification ───────────────────────────────────────────────────────

type RowKind =
  | { kind: "account_header"; codigo: string; nombre: string }
  | { kind: "saldo_inicial"; debito: number; credito: number }
  | { kind: "transaction"; mes: string; debito: number; credito: number }
  | { kind: "total" }
  | { kind: "skip" }

function classifyRow(row: unknown[], cols: ColMap): RowKind {
  const first = (row[0] ?? "").toString().trim()
  const rowText = row.map(c => (c ?? "").toString()).join(" ")

  // Account header: first cell is a leaf account code (4-10 digits)
  if (LEAF_CODE_RE.test(first)) {
    const nombre = (row[cols.nombre] ?? "").toString().trim() || first
    return { kind: "account_header", codigo: first, nombre }
  }

  // Total row
  if (TOTAL_ROW_RE.test(first) || TOTAL_ROW_RE.test(rowText)) {
    return { kind: "total" }
  }

  // SALDO INICIAL row — match anywhere in the row text
  if (SALDO_INICIAL_RE.test(rowText)) {
    const debito  = toFloat(row[cols.debito])
    const credito = toFloat(row[cols.credito])
    return { kind: "saldo_inicial", debito, credito }
  }

  // Transaction row: must have a parseable date AND a non-zero debit or credit
  const mes    = toYYYYMM(row[cols.fecha])
  const debito  = toFloat(row[cols.debito])
  const credito = toFloat(row[cols.credito])

  if (mes && (debito !== 0 || credito !== 0)) {
    return { kind: "transaction", mes, debito, credito }
  }

  return { kind: "skip" }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Parse a World Office Libro Auxiliar Excel file (as a Buffer or base64 string)
 * into a LibroAuxiliarParsed structure.
 *
 * @param source  Buffer (file bytes) or base64 string
 */
export function parseWorldOffice(source: Buffer | string): LibroAuxiliarParsed {
  const wb = typeof source === "string"
    ? XLSX.read(source, { type: "base64", cellDates: false })
    : XLSX.read(source, { type: "buffer", cellDates: false })

  // Use the first sheet
  const sheetName = wb.SheetNames[0]
  const ws = wb.Sheets[sheetName]

  // Convert to array of arrays (raw values, no formatting)
  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: "",
    raw: true,
  })

  const cols = detectColumns(rows)

  const cuentaMap = new Map<string, CuentaMovimientos>()
  const mesesSet  = new Set<string>()

  let currentCuenta: CuentaMovimientos | null = null

  for (const row of rows) {
    if (!row.some(c => c !== "" && c != null)) continue  // blank row

    const classified = classifyRow(row, cols)

    switch (classified.kind) {
      case "account_header": {
        // Start a new account section (or retrieve existing if repeated)
        if (!cuentaMap.has(classified.codigo)) {
          const cuenta: CuentaMovimientos = {
            codigo:             classified.codigo,
            nombre:             classified.nombre,
            saldoInicial:       0,
            movimientosPorMes:  {},
          }
          cuentaMap.set(classified.codigo, cuenta)
        }
        currentCuenta = cuentaMap.get(classified.codigo)!
        break
      }

      case "saldo_inicial": {
        if (!currentCuenta) break
        // Net: debit opening balance is positive, credit is negative
        // (credit-normal accounts like income will have a negative saldoInicial)
        currentCuenta.saldoInicial += classified.debito - classified.credito
        break
      }

      case "transaction": {
        if (!currentCuenta) break
        mesesSet.add(classified.mes)
        const existing = currentCuenta.movimientosPorMes[classified.mes]
        if (existing) {
          existing.debitos  += classified.debito
          existing.creditos += classified.credito
        } else {
          currentCuenta.movimientosPorMes[classified.mes] = {
            debitos:  classified.debito,
            creditos: classified.credito,
          }
        }
        break
      }

      case "total":
      case "skip":
        // nothing
        break
    }
  }

  const meses = Array.from(mesesSet).sort()

  return {
    softwareContable: "world_office",
    meses,
    cuentas: Array.from(cuentaMap.values()),
  }
}
