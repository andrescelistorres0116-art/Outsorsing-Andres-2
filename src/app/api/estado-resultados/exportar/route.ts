/**
 * POST /api/estado-resultados/exportar
 *
 * Receives a computed EstadoResultados JSON and returns an Excel (.xlsx) file.
 *
 * Body: { estadoResultados: EstadoResultados; empresaNombre: string }
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import * as XLSX from "xlsx"
import type { EstadoResultados, LineaEstadoResultados, SubtotalEstadoResultados } from "@/lib/estado-resultados/types"

// ─── Excel formatting helpers ─────────────────────────────────────────────────

const COP = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

function fmt(n: number): number {
  // Store raw numbers — Excel will format them
  return n
}

function mesLabel(mes: string): string {
  // "2026-07" → "Jul-26"
  const [y, m] = mes.split("-")
  const names = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
  const monthIdx = parseInt(m, 10) - 1
  return `${names[monthIdx] ?? m}-${y.slice(2)}`
}

// ─── Build the AOA (array-of-arrays) sheet ───────────────────────────────────

function buildRows(
  er: EstadoResultados,
  empresaNombre: string
): (string | number | null)[][] {
  const meses = er.meses
  const headers = ["Concepto", "Total Acumulado", ...meses.map(mesLabel)]

  const rows: (string | number | null)[][] = []

  // Title
  rows.push([`Estado de Resultados — ${empresaNombre}`])
  rows.push([`Período: ${meses[0] ?? ""} a ${meses[meses.length - 1] ?? ""}`])
  rows.push([])
  rows.push(headers)

  function lineRow(l: LineaEstadoResultados | SubtotalEstadoResultados, indent = 0): (string | number | null)[] {
    const label = ("  ".repeat(indent)) + l.concepto
    return [label, fmt(l.acumulado), ...meses.map(m => fmt(l.porMes[m] ?? 0))]
  }

  function sectionHeader(title: string): (string | number | null)[] {
    return [title, null, ...meses.map(() => null)]
  }

  function blankRow(): (string | number | null)[] {
    return [null, null, ...meses.map(() => null)]
  }

  // Ingresos Operacionales
  rows.push(sectionHeader("INGRESOS OPERACIONALES"))
  for (const l of er.ingresos_operacionales) rows.push(lineRow(l, 1))
  rows.push(lineRow(er.total_ingresos_operacionales))
  rows.push(blankRow())

  // Costos de Ventas
  if (er.costos_ventas.length > 0) {
    rows.push(sectionHeader("COSTOS DE VENTAS"))
    for (const l of er.costos_ventas) rows.push(lineRow(l, 1))
    rows.push(lineRow(er.total_costos_ventas))
    rows.push(blankRow())
  }

  rows.push(lineRow(er.utilidad_bruta))
  rows.push(blankRow())

  // Gastos Administrativos
  rows.push(sectionHeader("GASTOS ADMINISTRATIVOS"))
  for (const l of er.gastos_administrativos) rows.push(lineRow(l, 1))
  rows.push(lineRow(er.total_gastos_administrativos))
  rows.push(blankRow())

  // Gastos de Ventas
  if (er.gastos_ventas.length > 0) {
    rows.push(sectionHeader("GASTOS DE VENTAS"))
    for (const l of er.gastos_ventas) rows.push(lineRow(l, 1))
    rows.push(lineRow(er.total_gastos_ventas))
    rows.push(blankRow())
  }

  rows.push(lineRow(er.utilidad_operacional))
  rows.push(blankRow())

  // Ingresos / Gastos No Operacionales
  if (er.ingresos_no_operacionales.length > 0) {
    rows.push(sectionHeader("INGRESOS NO OPERACIONALES"))
    for (const l of er.ingresos_no_operacionales) rows.push(lineRow(l, 1))
    rows.push(lineRow(er.total_ingresos_no_op))
    rows.push(blankRow())
  }
  if (er.gastos_no_operacionales.length > 0) {
    rows.push(sectionHeader("GASTOS NO OPERACIONALES"))
    for (const l of er.gastos_no_operacionales) rows.push(lineRow(l, 1))
    rows.push(lineRow(er.total_gastos_no_op))
    rows.push(blankRow())
  }

  rows.push(lineRow(er.utilidad_antes_impuestos))
  rows.push(blankRow())

  // Impuesto de Renta
  if (er.impuesto_renta.length > 0) {
    rows.push(sectionHeader("IMPUESTO DE RENTA"))
    for (const l of er.impuesto_renta) rows.push(lineRow(l, 1))
    rows.push(lineRow(er.total_impuesto_renta))
    rows.push(blankRow())
  }

  rows.push(lineRow(er.utilidad_neta))

  return rows
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  let body: { estadoResultados: EstadoResultados; empresaNombre?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const { estadoResultados: er, empresaNombre = "Empresa" } = body

  if (!er) {
    return NextResponse.json({ error: "estadoResultados requerido" }, { status: 400 })
  }

  try {
    const rows = buildRows(er, empresaNombre)
    const ws   = XLSX.utils.aoa_to_sheet(rows)
    const wb   = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Estado de Resultados")

    // Column widths
    ws["!cols"] = [
      { wch: 45 },                              // Concepto
      { wch: 18 },                              // Total Acumulado
      ...er.meses.map(() => ({ wch: 15 })),     // one per month
    ]

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
    const fileName = `estado-resultados-${empresaNombre.replace(/\s+/g, "-")}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    })
  } catch (err: any) {
    console.error("[estado-resultados/exportar] Error:", err)
    return NextResponse.json({ error: err?.message ?? "Error generando el Excel" }, { status: 500 })
  }
}
