import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getNominaSession, canAccess, unauthorized, forbidden } from "@/lib/nomina-auth"
import * as XLSX from "xlsx"

export const dynamic = "force-dynamic"

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

const TIPO_LABEL: Record<string, string> = {
  BONIFICACIONES:        "Bonificación ocasional",
  COMISIONES:            "Comisiones",
  RETIRO:                "Retiro",
  LIBRANZA:              "Libranza",
  VACACIONES:            "Vacaciones",
  HORAS_EXTRAS:          "Hora extra ordinaria",
  HORAS_EXTRAS_NOCTURNAS:"Hora extra nocturna",
  RECARGOS:              "Recargo nocturno",
  DOMINICALES:           "Dominicales",
  LICENCIA:              "Licencia de luto",
  INCAPACIDAD:           "Incapacidad",
  LLEGADA_TARDE:         "Llegadas tarde",
  INGRESO:               "Ingreso",
  AUSENCIA:              "Ausencia",
  OTRA:                  "Otra novedad",
}

const PERIODO_LABEL: Record<string, string> = {
  PRIMERA_QUINCENA: "1ra Quincena (1–15)",
  SEGUNDA_QUINCENA: "2da Quincena (16–fin)",
  MENSUAL:          "Mensual",
}

function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return ""
  const s = typeof d === "string" ? d : d.toISOString()
  return s.split("T")[0]
}

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getNominaSession()
  if (!session) return unauthorized()

  const { id } = await context.params

  const reporte = await prisma.reporteNomina.findUnique({
    where: { id },
    include: {
      empresa: { select: { razonSocial: true, nit: true, nombreComercial: true } },
      novedades: {
        include: {
          empleado: {
            select: { nombre: true, numeroDocumento: true, tipoDocumento: true, cargo: true, salarioBase: true },
          },
          libranza: { select: { entidad: true } },
        },
        orderBy: [{ empleado: { nombre: "asc" } }, { tipoNovedad: "asc" }],
      },
    },
  })

  if (!reporte) return NextResponse.json({ error: "Reporte no encontrado" }, { status: 404 })
  if (!canAccess(session, reporte.empresaId)) return forbidden()

  const empresa = reporte.empresa.nombreComercial ?? reporte.empresa.razonSocial
  const periodo = PERIODO_LABEL[reporte.periodo] ?? reporte.periodo
  const mesAnio = `${MESES[reporte.mes - 1]} ${reporte.año}`

  // ── Build worksheet rows ─────────────────────────────────────────────────────

  // Info header rows (merged visually via indent)
  const infoRows = [
    ["Empresa:",      empresa],
    ["NIT:",          reporte.empresa.nit],
    ["Período:",      `${periodo} — ${mesAnio}`],
    ["Estado:",       reporte.estado],
    ["Inicio período:", fmtDate(reporte.fechaInicioPeriodo)],
    ["Fin período:",  fmtDate(reporte.fechaFinPeriodo)],
    [],
  ]

  const headers = [
    "Empleado",
    "Documento",
    "Cargo",
    "Salario Base ($)",
    "Tipo de Novedad",
    "Entidad / Observación",
    "Valor ($)",
    "Horas",
    "Días",
    "Cuota #",
    "Total Cuotas",
    "Valor Cuota ($)",
    "Fecha Inicio",
    "Fecha Fin",
  ]

  const dataRows = reporte.novedades.map((n) => {
    const obs = n.libranza?.entidad ?? n.descripcion ?? ""
    return [
      n.empleado.nombre,
      `${n.empleado.tipoDocumento ?? "CC"} ${n.empleado.numeroDocumento}`,
      n.empleado.cargo ?? "",
      n.empleado.salarioBase != null ? Number(n.empleado.salarioBase) : "",
      TIPO_LABEL[n.tipoNovedad] ?? n.tipoNovedad,
      obs,
      n.valor != null ? Number(n.valor) : "",
      n.horas != null ? Number(n.horas) : "",
      n.diasAusencia != null ? n.diasAusencia : "",
      n.cuotaNumero != null ? n.cuotaNumero : "",
      n.numeroCuotas != null ? n.numeroCuotas : "",
      n.valorCuota != null ? Number(n.valorCuota) : "",
      fmtDate(n.fechaInicioNovedad),
      fmtDate(n.fechaFinNovedad),
    ]
  })

  // ── Assemble sheet ───────────────────────────────────────────────────────────

  const allRows = [...infoRows, headers, ...dataRows]
  const ws = XLSX.utils.aoa_to_sheet(allRows)

  // Column widths
  ws["!cols"] = [
    { wch: 30 }, // Empleado
    { wch: 18 }, // Documento
    { wch: 20 }, // Cargo
    { wch: 16 }, // Salario
    { wch: 24 }, // Tipo
    { wch: 28 }, // Obs
    { wch: 14 }, // Valor
    { wch: 8  }, // Horas
    { wch: 8  }, // Días
    { wch: 8  }, // Cuota #
    { wch: 12 }, // Total cuotas
    { wch: 14 }, // Valor cuota
    { wch: 14 }, // Fecha inicio
    { wch: 14 }, // Fecha fin
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Novedades")

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

  const fileName = `Nomina_${empresa.replace(/\s+/g, "_")}_${mesAnio.replace(/\s+/g, "_")}_${reporte.periodo}.xlsx`

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  })
}
