/**
 * parser-world-office.ts
 *
 * Parses a World Office "Libro Auxiliar" Excel export into a
 * software-agnostic LibroAuxiliarParsed structure.
 *
 * ─── Actual World Office Libro Auxiliar row layout ──────────────────────────
 *
 * Row 0:  Company name (plain text)
 * Row 1:  Period description, e.g. "Libro Auxiliar entre el 01/01/2026 y el 31/01/2026"
 * Row 3:  Header row — "Cuenta | Tercero | Fecha | Nota | Cheque | Doc Num | Debitos | Creditos | Saldo"
 *
 * For each account:
 *
 *   Account/first-data row  [col0 = "CODE ACCOUNTNAME", col1 = tercero or "", col2 = date, col3 = description]
 *     - If col3 = "SALDO INICIAL" → opening balance row (col6/7 carry amounts)
 *     - Else → first transaction for the account
 *   Subsequent transaction rows  [col0 = "", col1 = tercero, col2 = date, col3 = desc, col6 = déb, col7 = cré]
 *   Total row  [col0 = "Total CODE ACCOUNTNAME", col6 = sum-déb, col7 = sum-cré]
 *
 * ─── Sign convention stored in CuentaMovimientos ────────────────────────────
 *   saldoInicial positive → debit opening balance
 *   saldoInicial negative → credit opening balance
 *   movimientosPorMes.debitos / .creditos are always positive amounts.
 */

import * as XLSX from "xlsx"
import type { LibroAuxiliarParsed, CuentaMovimientos } from "./types"

// ─── Constants ────────────────────────────────────────────────────────────────

// Excel date origin: (serial-1) * 86400000 ms from this epoch
const EXCEL_EPOCH_MS = new Date(1899, 11, 30).getTime()

/**
 * Matches account header rows: col0 = "DIGITS<space>NAME"
 * Examples: "42100501 INTERESES", "51050601 SUELDOS", "618505 COSTO DE VENTAS …"
 * Groups: [1] = code (4–10 digits), [2] = name (rest of the string)
 */
const ACCOUNT_HEADER_RE = /^(\d{4,10})\s+(.+)/

/** Detect "Total …" rows (col0 starts with "Total") */
const TOTAL_ROW_RE = /^total/i

/** Detect "SALDO INICIAL" / "SALDO ANTERIOR" anywhere in the row */
const SALDO_INICIAL_RE = /saldo\s+(inicial|anterior)/i

// ─── Date helpers ─────────────────────────────────────────────────────────────

/**
 * Convert an Excel serial number or string date to "YYYY-MM".
 * Returns null when the value cannot be interpreted as a date.
 */
function toYYYYMM(raw: unknown): string | null {
  if (raw == null || raw === "") return null

  let date: Date | null = null

  if (typeof raw === "number" && raw > 1000) {
    // Excel serial → ms from EXCEL_EPOCH_MS (accounts for Excel's 1900 leap-year bug)
    const ms = Math.round((raw - 1) * 86400000) + EXCEL_EPOCH_MS
    date = new Date(ms)
  } else if (raw instanceof Date) {
    date = raw
  } else if (typeof raw === "string") {
    const s = raw.trim()
    // ISO-style: YYYY-MM-DD
    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
    if (m) {
      date = new Date(+m[1], +m[2] - 1, +m[3])
    } else {
      // DD/MM/YYYY or D/M/YY (Colombian locale)
      m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/)
      if (m) {
        let yr = +m[3]
        if (yr < 100) yr += yr < 50 ? 2000 : 1900
        date = new Date(yr, +m[2] - 1, +m[1])
      }
    }
  }

  if (!date || isNaN(date.getTime())) return null
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

/** Parse a cell as float, returning 0 for empties or NaN */
function toFloat(raw: unknown): number {
  if (raw == null || raw === "") return 0
  if (typeof raw === "number") return isNaN(raw) ? 0 : raw
  const n = parseFloat(String(raw).replace(/[,\s]/g, ""))
  return isNaN(n) ? 0 : n
}

// ─── Column detection ─────────────────────────────────────────────────────────

interface ColMap {
  fecha: number    // date column
  debito: number   // debit column
  credito: number  // credit column
}

const HEADER_KEYWORDS = {
  fecha:   ["fecha", "date"],
  debito:  ["débito", "debito", "debe", "debit"],
  credito: ["crédito", "credito", "haber", "credit"],
}

/**
 * Scan the first `scanRows` rows for a header row and return detected column
 * positions. Falls back to: fecha=2, debito=6, credito=7 (World Office default).
 */
function detectColumns(rows: unknown[][], scanRows = 15): ColMap {
  const defaults: ColMap = { fecha: 2, debito: 6, credito: 7 }

  for (let i = 0; i < Math.min(scanRows, rows.length); i++) {
    const lower = rows[i].map(c => (c ?? "").toString().toLowerCase().trim())
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
      return found as ColMap
    }
  }

  return defaults
}

// ─── Row classification ───────────────────────────────────────────────────────

interface AccountHeaderRow {
  kind: "account_header"
  codigo: string
  nombre: string
  /** Opening balance data from this same row (balance accounts) */
  saldoInicial?: { debito: number; credito: number }
  /** First transaction data from this same row (income/expense accounts) */
  primeraTransaccion?: { mes: string; debito: number; credito: number }
}

type RowKind =
  | AccountHeaderRow
  | { kind: "transaction"; mes: string; debito: number; credito: number }
  | { kind: "total" }
  | { kind: "skip" }

function classifyRow(row: unknown[], cols: ColMap): RowKind {
  const col0 = (row[0] ?? "").toString().trim()

  // Total row: col0 starts with "Total"
  if (TOTAL_ROW_RE.test(col0)) return { kind: "total" }

  // Account header: col0 = "DIGITS ACCOUNTNAME"
  const accountMatch = col0.match(ACCOUNT_HEADER_RE)
  if (accountMatch) {
    const codigo = accountMatch[1]
    const nombre = accountMatch[2].trim()

    const rowText = row.map(c => (c ?? "").toString()).join(" ")
    const debito  = toFloat(row[cols.debito])
    const credito = toFloat(row[cols.credito])

    if (SALDO_INICIAL_RE.test(rowText)) {
      // Balance accounts: this row carries opening balance, not a monthly movement
      return {
        kind: "account_header",
        codigo,
        nombre,
        saldoInicial: { debito, credito },
      }
    }

    // Income/expense (or any other) accounts: this row IS the first transaction
    const mes = toYYYYMM(row[cols.fecha])
    if (mes && (debito !== 0 || credito !== 0)) {
      return {
        kind: "account_header",
        codigo,
        nombre,
        primeraTransaccion: { mes, debito, credito },
      }
    }

    // Account header with no data in this row (unlikely)
    return { kind: "account_header", codigo, nombre }
  }

  // Subsequent transaction row: col0 empty, col1 has tercero, col2 has date
  const col1 = (row[1] ?? "").toString().trim()
  if (!col0 && col1) {
    const mes    = toYYYYMM(row[cols.fecha])
    const debito  = toFloat(row[cols.debito])
    const credito = toFloat(row[cols.credito])

    if (mes && (debito !== 0 || credito !== 0)) {
      return { kind: "transaction", mes, debito, credito }
    }
  }

  return { kind: "skip" }
}

// ─── Accumulate into an existing cuenta ──────────────────────────────────────

function addMovement(
  cuenta: CuentaMovimientos,
  mes: string,
  debito: number,
  credito: number,
  mesesSet: Set<string>
) {
  mesesSet.add(mes)
  const existing = cuenta.movimientosPorMes[mes]
  if (existing) {
    existing.debitos  += debito
    existing.creditos += credito
  } else {
    cuenta.movimientosPorMes[mes] = { debitos: debito, creditos: credito }
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Parse a World Office Libro Auxiliar Excel file (Buffer or base64 string)
 * into a LibroAuxiliarParsed structure.
 */
export function parseWorldOffice(source: Buffer | string): LibroAuxiliarParsed {
  const wb = typeof source === "string"
    ? XLSX.read(source, { type: "base64", cellDates: false, raw: true })
    : XLSX.read(source, { type: "buffer", cellDates: false, raw: true })

  // Use the first sheet
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: "",
    raw: true,
  })

  const cols      = detectColumns(rows)
  const cuentaMap = new Map<string, CuentaMovimientos>()
  const mesesSet  = new Set<string>()

  let currentCuenta: CuentaMovimientos | null = null

  for (const row of rows) {
    // Skip completely blank rows
    if (!row.some(c => c !== "" && c != null)) continue

    const classified = classifyRow(row, cols)

    switch (classified.kind) {
      case "account_header": {
        const { codigo, nombre, saldoInicial, primeraTransaccion } = classified

        // Create account entry if not seen yet
        if (!cuentaMap.has(codigo)) {
          cuentaMap.set(codigo, {
            codigo,
            nombre,
            saldoInicial:      0,
            movimientosPorMes: {},
          })
        }
        currentCuenta = cuentaMap.get(codigo)!

        // Apply opening balance (debit positive, credit negative)
        if (saldoInicial) {
          currentCuenta.saldoInicial += saldoInicial.debito - saldoInicial.credito
        }

        // Apply first transaction
        if (primeraTransaccion) {
          addMovement(
            currentCuenta,
            primeraTransaccion.mes,
            primeraTransaccion.debito,
            primeraTransaccion.credito,
            mesesSet
          )
        }
        break
      }

      case "transaction": {
        if (!currentCuenta) break
        addMovement(currentCuenta, classified.mes, classified.debito, classified.credito, mesesSet)
        break
      }

      case "total":
      case "skip":
        break
    }
  }

  // Sort months chronologically
  const meses = Array.from(mesesSet).sort()

  return {
    softwareContable: "world_office",
    meses,
    cuentas: Array.from(cuentaMap.values()),
  }
}
