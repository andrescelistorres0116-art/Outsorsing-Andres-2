"use client"

/**
 * TablaEstadoResultados.tsx
 *
 * Renders the income statement as a multi-column table:
 *   Concepto | Total Acumulado | Mes1 | Mes2 | …
 *
 * Features:
 *   - Crosshair highlight: hovering any cell highlights its full row AND column.
 *   - Negative values are rendered in red.
 */

import React, { useState, useCallback } from "react"
import type {
  EstadoResultados,
  LineaEstadoResultados,
  SubtotalEstadoResultados,
} from "@/lib/estado-resultados/types"

// ─── Formatting ───────────────────────────────────────────────────────────────

const COP = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

function fmtNum(n: number): string {
  return COP.format(n)
}

function mesLabel(mes: string): string {
  const [y, m] = mes.split("-")
  const names = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
  return `${names[parseInt(m, 10) - 1] ?? m}-${y.slice(2)}`
}

// ─── Row data model ───────────────────────────────────────────────────────────

type RowItem =
  | { type: "section"; label: string }
  | { type: "line";    linea: LineaEstadoResultados; indent: boolean }
  | { type: "subtotal"; subtotal: SubtotalEstadoResultados; variant: "default" | "primary" | "strong" }

// ─── Crosshair highlight logic ────────────────────────────────────────────────

function cellBg(
  rowIdx: number,
  colIdx: number,
  hovRow: number,
  hovCol: number,
  baseVariant?: "primary" | "strong" | "section"
): string {
  const isRow = hovRow >= 0 && hovRow === rowIdx
  const isCol = hovCol >= 0 && hovCol === colIdx

  if (!isRow && !isCol) return ""

  // Intersection cell gets stronger highlight
  if (isRow && isCol) {
    if (baseVariant === "strong")  return "bg-primary/30 dark:bg-primary/25"
    if (baseVariant === "primary") return "bg-primary/25 dark:bg-primary/20"
    return "bg-primary/20 dark:bg-primary/15"
  }

  // Row or column highlight
  if (baseVariant === "strong")  return "bg-primary/20 dark:bg-primary/15"
  if (baseVariant === "primary") return "bg-primary/15 dark:bg-primary/10"
  if (baseVariant === "section") return "bg-muted/60 dark:bg-muted/60"   // section headers stay muted
  return "bg-primary/10 dark:bg-primary/8"
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props { er: EstadoResultados }

export default function TablaEstadoResultados({ er }: Props) {
  const { meses } = er
  const colSpan = 2 + meses.length

  const [hovRow, setHovRow] = useState(-1)
  const [hovCol, setHovCol] = useState(-1)
  const onLeave = useCallback(() => { setHovRow(-1); setHovCol(-1) }, [])

  // ── Build flat row list ───────────────────────────────────────────────────

  const rows: RowItem[] = []

  if (er.ingresos_operacionales.length > 0) {
    rows.push({ type: "section", label: "Ingresos Operacionales" })
    er.ingresos_operacionales.forEach(l => rows.push({ type: "line", linea: l, indent: true }))
    rows.push({ type: "subtotal", subtotal: er.total_ingresos_operacionales, variant: "default" })
  }

  if (er.costos_ventas.length > 0) {
    rows.push({ type: "section", label: "Costos de Ventas" })
    er.costos_ventas.forEach(l => rows.push({ type: "line", linea: l, indent: true }))
    rows.push({ type: "subtotal", subtotal: er.total_costos_ventas, variant: "default" })
  }

  rows.push({ type: "subtotal", subtotal: er.utilidad_bruta, variant: "primary" })

  if (er.gastos_administrativos.length > 0) {
    rows.push({ type: "section", label: "Gastos Administrativos" })
    er.gastos_administrativos.forEach(l => rows.push({ type: "line", linea: l, indent: true }))
    rows.push({ type: "subtotal", subtotal: er.total_gastos_administrativos, variant: "default" })
  }

  if (er.gastos_ventas.length > 0) {
    rows.push({ type: "section", label: "Gastos de Ventas" })
    er.gastos_ventas.forEach(l => rows.push({ type: "line", linea: l, indent: true }))
    rows.push({ type: "subtotal", subtotal: er.total_gastos_ventas, variant: "default" })
  }

  rows.push({ type: "subtotal", subtotal: er.utilidad_operacional, variant: "primary" })

  if (er.ingresos_no_operacionales.length > 0) {
    rows.push({ type: "section", label: "Ingresos No Operacionales" })
    er.ingresos_no_operacionales.forEach(l => rows.push({ type: "line", linea: l, indent: true }))
    rows.push({ type: "subtotal", subtotal: er.total_ingresos_no_op, variant: "default" })
  }

  if (er.gastos_no_operacionales.length > 0) {
    rows.push({ type: "section", label: "Gastos No Operacionales" })
    er.gastos_no_operacionales.forEach(l => rows.push({ type: "line", linea: l, indent: true }))
    rows.push({ type: "subtotal", subtotal: er.total_gastos_no_op, variant: "default" })
  }

  rows.push({ type: "subtotal", subtotal: er.utilidad_antes_impuestos, variant: "primary" })

  if (er.impuesto_renta.length > 0) {
    rows.push({ type: "section", label: "Impuesto de Renta" })
    er.impuesto_renta.forEach(l => rows.push({ type: "line", linea: l, indent: true }))
    rows.push({ type: "subtotal", subtotal: er.total_impuesto_renta, variant: "default" })
  }

  rows.push({ type: "subtotal", subtotal: er.utilidad_neta, variant: "strong" })

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="overflow-auto rounded-lg border border-border max-h-[70vh]">
      <table
        className="w-full border-collapse text-sm min-w-[600px]"
        onMouseLeave={onLeave}
      >
        {/* Header row — sticky so month titles stay visible while scrolling */}
        <thead className="sticky top-0 z-10">
          <tr className="bg-muted/60 border-b border-border">
            {/* col 0 */}
            <th
              className={`px-3 py-2.5 text-left font-semibold text-sm w-[40%] transition-colors bg-muted/60 ${cellBg(-1, 0, hovRow, hovCol)}`}
              onMouseEnter={() => { setHovRow(-1); setHovCol(0) }}
            >
              Concepto
            </th>
            {/* col 1 */}
            <th
              className={`px-3 py-2.5 text-right font-semibold text-sm whitespace-nowrap transition-colors bg-muted/60 ${cellBg(-1, 1, hovRow, hovCol)}`}
              onMouseEnter={() => { setHovRow(-1); setHovCol(1) }}
            >
              Total Acumulado
            </th>
            {meses.map((m, i) => (
              <th
                key={m}
                className={`px-3 py-2.5 text-right font-semibold text-sm whitespace-nowrap transition-colors bg-muted/60 ${cellBg(-1, i + 2, hovRow, hovCol)}`}
                onMouseEnter={() => { setHovRow(-1); setHovCol(i + 2) }}
              >
                {mesLabel(m)}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, rowIdx) => {
            if (row.type === "section") {
              return (
                <tr key={rowIdx} className="bg-muted/40">
                  <td
                    colSpan={colSpan}
                    className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-foreground/70"
                    onMouseEnter={() => { setHovRow(rowIdx); setHovCol(-1) }}
                  >
                    {row.label}
                  </td>
                </tr>
              )
            }

            if (row.type === "line") {
              const { linea, indent } = row
              return (
                <tr
                  key={rowIdx}
                  className="border-b border-border/30"
                >
                  {/* col 0 — Concepto */}
                  <td
                    className={`px-3 py-1.5 text-sm transition-colors cursor-default
                      ${indent ? "pl-6 text-foreground/80" : "font-medium"}
                      ${cellBg(rowIdx, 0, hovRow, hovCol)}`}
                    onMouseEnter={() => { setHovRow(rowIdx); setHovCol(0) }}
                  >
                    {linea.concepto}
                  </td>
                  {/* col 1 — Acumulado */}
                  <td
                    className={`px-3 py-1.5 text-right tabular-nums text-sm transition-colors cursor-default
                      ${linea.acumulado < 0 ? "text-red-500" : ""}
                      ${cellBg(rowIdx, 1, hovRow, hovCol)}`}
                    onMouseEnter={() => { setHovRow(rowIdx); setHovCol(1) }}
                  >
                    {fmtNum(linea.acumulado)}
                  </td>
                  {/* month columns */}
                  {meses.map((m, i) => {
                    const val = linea.porMes[m] ?? 0
                    return (
                      <td
                        key={m}
                        className={`px-3 py-1.5 text-right tabular-nums text-sm transition-colors cursor-default
                          ${val < 0 ? "text-red-500" : ""}
                          ${cellBg(rowIdx, i + 2, hovRow, hovCol)}`}
                        onMouseEnter={() => { setHovRow(rowIdx); setHovCol(i + 2) }}
                      >
                        {fmtNum(val)}
                      </td>
                    )
                  })}
                </tr>
              )
            }

            // type === "subtotal"
            const { subtotal, variant } = row
            const rowClass =
              variant === "strong"
                ? "bg-primary/10 border-t-2 border-primary/40"
                : variant === "primary"
                ? "bg-primary/5 border-t border-primary/20"
                : "border-t border-border/50"
            const textClass = variant === "strong" ? "font-bold text-sm" : "font-semibold text-sm"

            return (
              <tr key={rowIdx} className={rowClass}>
                {/* col 0 */}
                <td
                  className={`px-3 py-2 transition-colors cursor-default ${textClass} ${cellBg(rowIdx, 0, hovRow, hovCol, variant === "default" ? undefined : variant)}`}
                  onMouseEnter={() => { setHovRow(rowIdx); setHovCol(0) }}
                >
                  {subtotal.concepto}
                </td>
                {/* col 1 */}
                <td
                  className={`px-3 py-2 text-right tabular-nums transition-colors cursor-default
                    ${textClass}
                    ${subtotal.acumulado < 0 ? "text-red-500" : ""}
                    ${cellBg(rowIdx, 1, hovRow, hovCol, variant === "default" ? undefined : variant)}`}
                  onMouseEnter={() => { setHovRow(rowIdx); setHovCol(1) }}
                >
                  {fmtNum(subtotal.acumulado)}
                </td>
                {/* month columns */}
                {meses.map((m, i) => {
                  const val = subtotal.porMes[m] ?? 0
                  return (
                    <td
                      key={m}
                      className={`px-3 py-2 text-right tabular-nums transition-colors cursor-default
                        ${textClass}
                        ${val < 0 ? "text-red-500" : ""}
                        ${cellBg(rowIdx, i + 2, hovRow, hovCol, variant === "default" ? undefined : variant)}`}
                      onMouseEnter={() => { setHovRow(rowIdx); setHovCol(i + 2) }}
                    >
                      {fmtNum(val)}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
