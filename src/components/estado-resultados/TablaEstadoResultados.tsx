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
 *   - Click on a month cell of a line row → drill-down popup with individual
 *     transactions from the libro auxiliar (nota + value).
 *     Only available when `archivoId` is provided (single-archive view);
 *     the consolidated multi-archive view does not support drill-down.
 */

import React, { useState, useCallback, useEffect, useRef } from "react"
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

// ─── Drill-down popup ─────────────────────────────────────────────────────────

interface DrillDownTarget {
  empresaId: string
  archivoId: string
  cuentas: string[]
  mes: string
  concepto: string
}

interface Transaccion {
  id: string
  codigo: string
  concepto: string
  fecha: string
  nota: string
  debito: number
  credito: number
}

function DrillDownPopup({
  target,
  onClose,
}: {
  target: DrillDownTarget
  onClose: () => void
}) {
  const [txs, setTxs] = useState<Transaccion[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const { empresaId, archivoId, cuentas, mes } = target
    const params = new URLSearchParams({
      cuentas: cuentas.join(","),
      mes,
    })
    fetch(`/api/estado-resultados/archivos/${empresaId}/${archivoId}/transacciones?${params}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setTxs(data.transacciones ?? [])
      })
      .catch(e => setError(e.message))
  }, [target])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  const totalDebito  = txs ? txs.reduce((s, t) => s + t.debito, 0)  : 0
  const totalCredito = txs ? txs.reduce((s, t) => s + t.credito, 0) : 0

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onMouseDown={e => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-border">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {mesLabel(target.mes)}
            </p>
            <h3 className="font-semibold text-base leading-snug mt-0.5">
              {target.concepto}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {target.cuentas.length === 1
                ? `Cuenta ${target.cuentas[0]}`
                : `${target.cuentas.length} cuentas`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-muted-foreground hover:text-foreground rounded-md p-1 transition-colors"
            aria-label="Cerrar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-auto flex-1 p-0">
          {error ? (
            <div className="p-6 text-center text-sm text-red-500">{error}</div>
          ) : txs === null ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Cargando…</div>
          ) : txs.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No hay movimientos individuales para esta celda.<br/>
              <span className="text-xs">(Los archivos subidos antes de esta actualización no tienen detalle guardado. Vuelve a subirlos para habilitarlo.)</span>
            </div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 bg-muted/60">
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left font-semibold text-xs">Fecha</th>
                  <th className="px-3 py-2 text-left font-semibold text-xs">Nota / Descripción</th>
                  <th className="px-3 py-2 text-right font-semibold text-xs whitespace-nowrap">Débitos</th>
                  <th className="px-3 py-2 text-right font-semibold text-xs whitespace-nowrap">Créditos</th>
                </tr>
              </thead>
              <tbody>
                {txs.map(tx => (
                  <tr key={tx.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-1.5 text-xs text-muted-foreground whitespace-nowrap">
                      {tx.fecha}
                    </td>
                    <td className="px-3 py-1.5 text-xs max-w-[300px] break-words">
                      {tx.nota || <span className="text-muted-foreground italic">—</span>}
                    </td>
                    <td className={`px-3 py-1.5 text-right tabular-nums text-xs ${tx.debito > 0 ? "" : "text-muted-foreground"}`}>
                      {tx.debito > 0 ? fmtNum(tx.debito) : "—"}
                    </td>
                    <td className={`px-3 py-1.5 text-right tabular-nums text-xs ${tx.credito > 0 ? "" : "text-muted-foreground"}`}>
                      {tx.credito > 0 ? fmtNum(tx.credito) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-border bg-muted/40 sticky bottom-0">
                <tr>
                  <td colSpan={2} className="px-3 py-2 text-xs font-semibold text-right">
                    Total ({txs.length} movimiento{txs.length !== 1 ? "s" : ""})
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-xs font-semibold">
                    {fmtNum(totalDebito)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-xs font-semibold">
                    {fmtNum(totalCredito)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  er: EstadoResultados
  /** When provided, month cells become clickable for drill-down */
  empresaId?: string
  archivoId?: string
}

export default function TablaEstadoResultados({ er, empresaId, archivoId }: Props) {
  const { meses } = er
  const colSpan = 2 + meses.length

  const [hovRow, setHovRow] = useState(-1)
  const [hovCol, setHovCol] = useState(-1)
  const onLeave = useCallback(() => { setHovRow(-1); setHovCol(-1) }, [])

  const [drillDown, setDrillDown] = useState<DrillDownTarget | null>(null)
  const canDrillDown = !!(empresaId && archivoId)

  const openDrillDown = useCallback(
    (linea: LineaEstadoResultados, mes: string) => {
      if (!canDrillDown) return
      setDrillDown({
        empresaId: empresaId!,
        archivoId: archivoId!,
        cuentas:   linea.cuentas,
        mes,
        concepto:  linea.concepto,
      })
    },
    [canDrillDown, empresaId, archivoId]
  )

  const closeDrillDown = useCallback(() => setDrillDown(null), [])

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
    <>
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
                    {/* col 1 — Acumulado (no drill-down: spans all archives) */}
                    <td
                      className={`px-3 py-1.5 text-right tabular-nums text-sm transition-colors cursor-default
                        ${linea.acumulado < 0 ? "text-red-500" : ""}
                        ${cellBg(rowIdx, 1, hovRow, hovCol)}`}
                      onMouseEnter={() => { setHovRow(rowIdx); setHovCol(1) }}
                    >
                      {fmtNum(linea.acumulado)}
                    </td>
                    {/* month columns — clickable for drill-down */}
                    {meses.map((m, i) => {
                      const val = linea.porMes[m] ?? 0
                      const drillable = canDrillDown && (linea.porMes[m] !== undefined)
                      return (
                        <td
                          key={m}
                          className={`px-3 py-1.5 text-right tabular-nums text-sm transition-colors
                            ${val < 0 ? "text-red-500" : ""}
                            ${drillable ? "cursor-pointer hover:underline hover:decoration-dotted" : "cursor-default"}
                            ${cellBg(rowIdx, i + 2, hovRow, hovCol)}`}
                          onMouseEnter={() => { setHovRow(rowIdx); setHovCol(i + 2) }}
                          onClick={drillable ? () => openDrillDown(linea, m) : undefined}
                          title={drillable ? "Clic para ver detalle de movimientos" : undefined}
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

      {drillDown && (
        <DrillDownPopup target={drillDown} onClose={closeDrillDown} />
      )}
    </>
  )
}
