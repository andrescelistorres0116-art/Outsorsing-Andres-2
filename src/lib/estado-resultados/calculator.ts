/**
 * calculator.ts
 *
 * Builds an EstadoResultados from a LibroAuxiliarParsed + exception list.
 *
 * Display grouping:
 *   • Accounts with prefix 5105** or 5205** are merged into one
 *     "Gastos de personal" line that appears before the rest of the
 *     admin / ventas sub-items. They are NOT double-counted: they are
 *     removed from the regular per-account breakdown.
 *
 * Sign convention for LineaEstadoResultados.porMes / .acumulado:
 *   • Positive = the amount is real (income is income, expense is expense).
 *   • Subtraction/addition for P&L is done in the subtotal computation here
 *     and in the UI/export layer.
 */

import type {
  LibroAuxiliarParsed,
  ExcepcionClasificacion,
  LineaEstadoResultados,
  SubtotalEstadoResultados,
  EstadoResultados,
  CategoriaEstadoResultados,
  CuentaMovimientos,
} from "./types"
import {
  clasificarCuenta,
  netoCuenta,
  netoSaldoInicial,
  isGastosPersonal,
} from "./clasificacion"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function emptySubtotal(meses: string[]): SubtotalEstadoResultados {
  const porMes: Record<string, number> = {}
  meses.forEach(m => (porMes[m] = 0))
  return { concepto: "", acumulado: 0, porMes }
}

function sumLines(
  lines: LineaEstadoResultados[],
  meses: string[]
): SubtotalEstadoResultados {
  const porMes: Record<string, number> = {}
  meses.forEach(m => (porMes[m] = 0))
  let acumulado = 0
  for (const l of lines) {
    acumulado += l.acumulado
    for (const m of meses) porMes[m] = (porMes[m] ?? 0) + (l.porMes[m] ?? 0)
  }
  return { concepto: "", acumulado, porMes }
}

function subtractSubtotals(
  a: SubtotalEstadoResultados,
  ...bs: SubtotalEstadoResultados[]
): SubtotalEstadoResultados {
  const porMes: Record<string, number> = { ...a.porMes }
  let acumulado = a.acumulado
  for (const b of bs) {
    acumulado -= b.acumulado
    for (const m of Object.keys(porMes)) {
      porMes[m] = (porMes[m] ?? 0) - (b.porMes[m] ?? 0)
    }
  }
  return { concepto: "", acumulado, porMes }
}

function addSubtotals(
  ...items: SubtotalEstadoResultados[]
): SubtotalEstadoResultados {
  if (items.length === 0) return { concepto: "", acumulado: 0, porMes: {} }
  const porMes: Record<string, number> = {}
  for (const it of items) {
    for (const [m, v] of Object.entries(it.porMes)) {
      porMes[m] = (porMes[m] ?? 0) + v
    }
  }
  return { concepto: "", acumulado: items.reduce((s, i) => s + i.acumulado, 0), porMes }
}

// ─── Build a LineaEstadoResultados from a single cuenta ──────────────────────

function buildLinea(
  cuenta: CuentaMovimientos,
  categoria: CategoriaEstadoResultados,
  meses: string[]
): LineaEstadoResultados {
  const porMes: Record<string, number> = {}
  meses.forEach(m => (porMes[m] = 0))

  let acumulado = netoSaldoInicial(cuenta.saldoInicial, categoria)

  for (const mes of meses) {
    const mov = cuenta.movimientosPorMes[mes]
    if (mov) {
      const neto = netoCuenta(mov.debitos, mov.creditos, categoria)
      porMes[mes] = neto
      acumulado  += neto
    }
  }

  return {
    concepto:  cuenta.nombre || cuenta.codigo,
    categoria,
    cuentas:   [cuenta.codigo],
    acumulado,
    porMes,
  }
}

// ─── Merge multiple cuentas into one "Gastos de personal" line ───────────────

function buildGastosPersonalLinea(
  cuentas: { cuenta: CuentaMovimientos; categoria: CategoriaEstadoResultados }[],
  meses: string[]
): LineaEstadoResultados | null {
  if (cuentas.length === 0) return null

  const porMes: Record<string, number> = {}
  meses.forEach(m => (porMes[m] = 0))
  let acumulado = 0

  for (const { cuenta, categoria } of cuentas) {
    acumulado += netoSaldoInicial(cuenta.saldoInicial, categoria)
    for (const mes of meses) {
      const mov = cuenta.movimientosPorMes[mes]
      if (mov) {
        const neto = netoCuenta(mov.debitos, mov.creditos, categoria)
        porMes[mes] = (porMes[mes] ?? 0) + neto
        acumulado  += neto
      }
    }
  }

  return {
    concepto:  "Gastos de personal",
    categoria: "gastos_administrativos",  // placeholder; rendered specially
    esGrupo:   true,
    cuentas:   cuentas.map(c => c.cuenta.codigo),
    acumulado,
    porMes,
  }
}

// ─── Main calculator ──────────────────────────────────────────────────────────

export function calcularEstadoResultados(
  libro: LibroAuxiliarParsed,
  excepciones: Pick<ExcepcionClasificacion, "prefijoCuenta" | "categoriaDestino">[] = []
): EstadoResultados {
  // Only keep months that have at least one relevant (non-ignorar) account with actual movements.
  // This filters out months that appear only because of balance-sheet or equity adjustments.
  const relevantCuentas = libro.cuentas.filter(
    c => clasificarCuenta(c.codigo, excepciones) !== "ignorar"
  )
  const meses = libro.meses.filter(mes =>
    relevantCuentas.some(c => {
      const mov = c.movimientosPorMes[mes]
      return mov && (mov.debitos > 0 || mov.creditos > 0)
    })
  )

  // Buckets for regular lines
  const buckets: Record<CategoriaEstadoResultados, LineaEstadoResultados[]> = {
    ingresos_operacionales:     [],
    ingresos_no_operacionales:  [],
    gastos_administrativos:     [],
    gastos_ventas:              [],
    gastos_no_operacionales:    [],
    costos_ventas:              [],
    impuesto_renta:             [],
    ignorar:                    [],
  }

  // Gastos de personal accounts (5105** + 5205**) — excluded from buckets above
  const gastosPersonalCuentas: { cuenta: CuentaMovimientos; categoria: CategoriaEstadoResultados }[] = []

  for (const cuenta of libro.cuentas) {
    const categoria = clasificarCuenta(cuenta.codigo, excepciones)
    if (categoria === "ignorar") continue

    if (isGastosPersonal(cuenta.codigo)) {
      // Include in "Gastos de personal" group, not in the regular bucket
      gastosPersonalCuentas.push({ cuenta, categoria })
      continue
    }

    const linea = buildLinea(cuenta, categoria, meses)
    buckets[categoria].push(linea)
  }

  // Sort each bucket by account code
  for (const cat of Object.keys(buckets) as CategoriaEstadoResultados[]) {
    buckets[cat].sort((a, b) => (a.cuentas[0] ?? "").localeCompare(b.cuentas[0] ?? ""))
  }

  // Build "Gastos de personal" merged line and prepend to admin + ventas sections
  const gpLinea = buildGastosPersonalLinea(gastosPersonalCuentas, meses)
  if (gpLinea) {
    // Split by category: 5105 is admin, 5205 is ventas — merge into single line
    buckets.gastos_administrativos.unshift(gpLinea)
  }

  // ── Subtotals ────────────────────────────────────────────────────────────────

  const total_ingresos_operacionales = {
    ...sumLines(buckets.ingresos_operacionales, meses),
    concepto: "Total Ingresos Operacionales",
  }
  const total_costos_ventas = {
    ...sumLines(buckets.costos_ventas, meses),
    concepto: "Total Costos de Ventas",
  }
  const utilidad_bruta = {
    ...subtractSubtotals(total_ingresos_operacionales, total_costos_ventas),
    concepto: "Utilidad Bruta",
  }
  const total_gastos_administrativos = {
    ...sumLines(buckets.gastos_administrativos, meses),
    concepto: "Total Gastos Administrativos",
  }
  const total_gastos_ventas = {
    ...sumLines(buckets.gastos_ventas, meses),
    concepto: "Total Gastos de Ventas",
  }
  const utilidad_operacional = {
    ...subtractSubtotals(
      utilidad_bruta,
      total_gastos_administrativos,
      total_gastos_ventas
    ),
    concepto: "Utilidad Operacional",
  }
  const total_ingresos_no_op = {
    ...sumLines(buckets.ingresos_no_operacionales, meses),
    concepto: "Total Ingresos No Operacionales",
  }
  const total_gastos_no_op = {
    ...sumLines(buckets.gastos_no_operacionales, meses),
    concepto: "Total Gastos No Operacionales",
  }
  const utilidad_antes_impuestos = {
    ...subtractSubtotals(
      addSubtotals(utilidad_operacional, total_ingresos_no_op),
      total_gastos_no_op
    ),
    concepto: "Utilidad Antes de Impuestos",
  }
  const total_impuesto_renta = {
    ...sumLines(buckets.impuesto_renta, meses),
    concepto: "Impuesto de Renta",
  }
  const utilidad_neta = {
    ...subtractSubtotals(utilidad_antes_impuestos, total_impuesto_renta),
    concepto: "Utilidad Neta",
  }

  return {
    meses,
    ingresos_operacionales:    buckets.ingresos_operacionales,
    costos_ventas:             buckets.costos_ventas,
    gastos_administrativos:    buckets.gastos_administrativos,
    gastos_ventas:             buckets.gastos_ventas,
    ingresos_no_operacionales: buckets.ingresos_no_operacionales,
    gastos_no_operacionales:   buckets.gastos_no_operacionales,
    impuesto_renta:            buckets.impuesto_renta,
    total_ingresos_operacionales,
    total_costos_ventas,
    utilidad_bruta,
    total_gastos_administrativos,
    total_gastos_ventas,
    utilidad_operacional,
    total_ingresos_no_op,
    total_gastos_no_op,
    utilidad_antes_impuestos,
    total_impuesto_renta,
    utilidad_neta,
  }
}
