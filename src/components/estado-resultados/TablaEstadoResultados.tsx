"use client"

/**
 * TablaEstadoResultados.tsx
 *
 * Renders the income statement as a multi-column table:
 *   Concepto | Total Acumulado | Mes1 | Mes2 | …
 *
 * Positive values are shown in regular colour; negative values in red.
 */

import React from "react"
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function NumCell({ value, className = "" }: { value: number; className?: string }) {
  const isNeg = value < 0
  return (
    <td
      className={`px-3 py-1.5 text-right tabular-nums text-sm ${isNeg ? "text-red-500" : ""} ${className}`}
    >
      {fmtNum(value)}
    </td>
  )
}

function SectionHeader({ label, colSpan }: { label: string; colSpan: number }) {
  return (
    <tr className="bg-muted/40">
      <td
        colSpan={colSpan}
        className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-foreground/70"
      >
        {label}
      </td>
    </tr>
  )
}

function LineRow({
  linea,
  meses,
  indent = false,
}: {
  linea: LineaEstadoResultados
  meses: string[]
  indent?: boolean
}) {
  return (
    <tr className="hover:bg-muted/20 transition-colors border-b border-border/30">
      <td className={`px-3 py-1.5 text-sm ${indent ? "pl-6 text-foreground/80" : "font-medium"}`}>
        {linea.concepto}
      </td>
      <NumCell value={linea.acumulado} />
      {meses.map(m => (
        <NumCell key={m} value={linea.porMes[m] ?? 0} />
      ))}
    </tr>
  )
}

function SubtotalRow({
  subtotal,
  meses,
  variant = "default",
}: {
  subtotal: SubtotalEstadoResultados
  meses: string[]
  variant?: "default" | "primary" | "strong"
}) {
  const rowClass =
    variant === "strong"
      ? "bg-primary/10 border-t-2 border-primary/40"
      : variant === "primary"
      ? "bg-primary/5 border-t border-primary/20"
      : "border-t border-border/50"
  const textClass =
    variant === "strong"
      ? "font-bold text-sm"
      : "font-semibold text-sm"

  return (
    <tr className={`${rowClass}`}>
      <td className={`px-3 py-2 ${textClass}`}>{subtotal.concepto}</td>
      <td className={`px-3 py-2 text-right tabular-nums ${textClass} ${subtotal.acumulado < 0 ? "text-red-500" : ""}`}>
        {fmtNum(subtotal.acumulado)}
      </td>
      {meses.map(m => (
        <td
          key={m}
          className={`px-3 py-2 text-right tabular-nums ${textClass} ${(subtotal.porMes[m] ?? 0) < 0 ? "text-red-500" : ""}`}
        >
          {fmtNum(subtotal.porMes[m] ?? 0)}
        </td>
      ))}
    </tr>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  er: EstadoResultados
}

export default function TablaEstadoResultados({ er }: Props) {
  const { meses } = er
  const colSpan = 2 + meses.length  // Concepto + Acumulado + months

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-sm min-w-[600px]">
        <thead>
          <tr className="bg-muted/60 border-b border-border">
            <th className="px-3 py-2.5 text-left font-semibold text-sm w-[40%]">Concepto</th>
            <th className="px-3 py-2.5 text-right font-semibold text-sm whitespace-nowrap">
              Total Acumulado
            </th>
            {meses.map(m => (
              <th key={m} className="px-3 py-2.5 text-right font-semibold text-sm whitespace-nowrap">
                {mesLabel(m)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* ── Ingresos Operacionales ─────────────────────────── */}
          {er.ingresos_operacionales.length > 0 && (
            <>
              <SectionHeader label="Ingresos Operacionales" colSpan={colSpan} />
              {er.ingresos_operacionales.map(l => (
                <LineRow key={l.cuentas[0]} linea={l} meses={meses} indent />
              ))}
              <SubtotalRow subtotal={er.total_ingresos_operacionales} meses={meses} />
            </>
          )}

          {/* ── Costos de Ventas ───────────────────────────────── */}
          {er.costos_ventas.length > 0 && (
            <>
              <SectionHeader label="Costos de Ventas" colSpan={colSpan} />
              {er.costos_ventas.map(l => (
                <LineRow key={l.cuentas[0]} linea={l} meses={meses} indent />
              ))}
              <SubtotalRow subtotal={er.total_costos_ventas} meses={meses} />
            </>
          )}

          {/* ── Utilidad Bruta ─────────────────────────────────── */}
          <SubtotalRow subtotal={er.utilidad_bruta} meses={meses} variant="primary" />

          {/* ── Gastos Administrativos ─────────────────────────── */}
          {er.gastos_administrativos.length > 0 && (
            <>
              <SectionHeader label="Gastos Administrativos" colSpan={colSpan} />
              {er.gastos_administrativos.map(l => (
                <LineRow key={l.cuentas[0] ?? l.concepto} linea={l} meses={meses} indent />
              ))}
              <SubtotalRow subtotal={er.total_gastos_administrativos} meses={meses} />
            </>
          )}

          {/* ── Gastos de Ventas ───────────────────────────────── */}
          {er.gastos_ventas.length > 0 && (
            <>
              <SectionHeader label="Gastos de Ventas" colSpan={colSpan} />
              {er.gastos_ventas.map(l => (
                <LineRow key={l.cuentas[0] ?? l.concepto} linea={l} meses={meses} indent />
              ))}
              <SubtotalRow subtotal={er.total_gastos_ventas} meses={meses} />
            </>
          )}

          {/* ── Utilidad Operacional ───────────────────────────── */}
          <SubtotalRow subtotal={er.utilidad_operacional} meses={meses} variant="primary" />

          {/* ── Ingresos No Operacionales ──────────────────────── */}
          {er.ingresos_no_operacionales.length > 0 && (
            <>
              <SectionHeader label="Ingresos No Operacionales" colSpan={colSpan} />
              {er.ingresos_no_operacionales.map(l => (
                <LineRow key={l.cuentas[0]} linea={l} meses={meses} indent />
              ))}
              <SubtotalRow subtotal={er.total_ingresos_no_op} meses={meses} />
            </>
          )}

          {/* ── Gastos No Operacionales ────────────────────────── */}
          {er.gastos_no_operacionales.length > 0 && (
            <>
              <SectionHeader label="Gastos No Operacionales" colSpan={colSpan} />
              {er.gastos_no_operacionales.map(l => (
                <LineRow key={l.cuentas[0]} linea={l} meses={meses} indent />
              ))}
              <SubtotalRow subtotal={er.total_gastos_no_op} meses={meses} />
            </>
          )}

          {/* ── Utilidad Antes de Impuestos ────────────────────── */}
          <SubtotalRow subtotal={er.utilidad_antes_impuestos} meses={meses} variant="primary" />

          {/* ── Impuesto de Renta ──────────────────────────────── */}
          {er.impuesto_renta.length > 0 && (
            <>
              <SectionHeader label="Impuesto de Renta" colSpan={colSpan} />
              {er.impuesto_renta.map(l => (
                <LineRow key={l.cuentas[0]} linea={l} meses={meses} indent />
              ))}
              <SubtotalRow subtotal={er.total_impuesto_renta} meses={meses} />
            </>
          )}

          {/* ── Utilidad Neta ──────────────────────────────────── */}
          <SubtotalRow subtotal={er.utilidad_neta} meses={meses} variant="strong" />
        </tbody>
      </table>
    </div>
  )
}
