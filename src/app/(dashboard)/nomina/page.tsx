"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Clock,
  CheckCircle2,
  Send,
  Eye,
  Download,
  ThumbsUp,
  AlertCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EMPRESAS_MOCK, EmpresaMock } from "@/lib/empresas-mock";

// ── Types ──────────────────────────────────────────────────────────────────────

type EstadoNomina = "BORRADOR" | "ENVIADO" | "REVISADO" | "APROBADO";
type Periodo = "1-15" | "16-30" | "mensual";

interface ReporteNomina {
  id: string;
  empresaNumId: number;
  empresaSlug: string;
  empresa: string;
  periodicidadNomina: "quincenal" | "mensual";
  periodo: Periodo;
  mes: number;
  anio: number;
  estado: EstadoNomina;
  totalEmpleados: number;
  sinNovedades: boolean;
  enviadoPor?: string;
  fechaEnvio?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function rowId(empresa: string, periodo: Periodo, mes: number, anio: number): string {
  return `${toSlug(empresa)}|${periodo}|${mes}|${anio}`;
}

function isActiva(emp: EmpresaMock): boolean {
  if (emp.fechaFinRelacion) {
    const today = new Date().toISOString().split("T")[0];
    if (emp.fechaFinRelacion <= today) return false;
  }
  return emp.estado === "ACTIVA";
}

// Generate expected rows for a given month from empresa configuration
function generarFilas(empresas: EmpresaMock[], mes: number, anio: number): ReporteNomina[] {
  const rows: ReporteNomina[] = [];

  empresas
    .filter(
      (emp) =>
        isActiva(emp) &&
        emp.periodicidadNomina &&
        emp.periodicidadNomina !== "no_aplica" &&
        emp.tipoNomina !== "no_aplica"
    )
    .forEach((emp) => {
      const base = {
        empresaNumId: emp.id,
        empresaSlug: toSlug(emp.razonSocial),
        empresa: emp.razonSocial,
        mes,
        anio,
        estado: "BORRADOR" as EstadoNomina,
        totalEmpleados: 0,
        sinNovedades: false,
      };

      if (emp.periodicidadNomina === "quincenal") {
        rows.push({
          ...base,
          id: rowId(emp.razonSocial, "1-15", mes, anio),
          periodicidadNomina: "quincenal",
          periodo: "1-15",
        });
        rows.push({
          ...base,
          id: rowId(emp.razonSocial, "16-30", mes, anio),
          periodicidadNomina: "quincenal",
          periodo: "16-30",
        });
      } else {
        rows.push({
          ...base,
          id: rowId(emp.razonSocial, "mensual", mes, anio),
          periodicidadNomina: "mensual",
          periodo: "mensual",
        });
      }
    });

  return rows;
}

// ── Initial seeded data (pre-existing states for Jun/May 2026) ─────────────────

type Override = Partial<Omit<ReporteNomina, "id">>;

const INITIAL_OVERRIDES: Record<string, Override> = {
  // Junio 2026 — 1ra quincena
  [rowId("300 HILOS SAS", "1-15", 6, 2026)]: { estado: "ENVIADO", totalEmpleados: 10, enviadoPor: "Cliente - 300 Hilos", fechaEnvio: "2026-06-02" },
  [rowId("X TOURS SAS", "1-15", 6, 2026)]: { estado: "APROBADO", totalEmpleados: 8, sinNovedades: true, enviadoPor: "Cliente - X Tours", fechaEnvio: "2026-06-01" },
  [rowId("DIAZAR LTDA", "1-15", 6, 2026)]: { estado: "BORRADOR", totalEmpleados: 5 },
  [rowId("TEXTILES DEL NORTE SAS", "1-15", 6, 2026)]: { estado: "REVISADO", totalEmpleados: 15, enviadoPor: "Cliente - Textiles Norte", fechaEnvio: "2026-06-02" },
  [rowId("COMERCIAL TORRES LTDA", "1-15", 6, 2026)]: { estado: "ENVIADO", totalEmpleados: 7, sinNovedades: true, enviadoPor: "Cliente - C. Torres", fechaEnvio: "2026-06-03" },
  [rowId("LOGÍSTICA ANDINA SAS", "1-15", 6, 2026)]: { estado: "BORRADOR", totalEmpleados: 20 },
  [rowId("CONSTRUCTORA CIMA SAS", "1-15", 6, 2026)]: { estado: "APROBADO", totalEmpleados: 25, enviadoPor: "Cliente - C. Cima", fechaEnvio: "2026-06-01" },
  // Junio 2026 — mensual
  [rowId("INVERSIONES CASTILLO SAS", "mensual", 6, 2026)]: { estado: "BORRADOR", totalEmpleados: 12 },
  // Mayo 2026 — 2da quincena
  [rowId("300 HILOS SAS", "16-30", 5, 2026)]: { estado: "APROBADO", totalEmpleados: 10, enviadoPor: "Cliente - 300 Hilos", fechaEnvio: "2026-05-18" },
  [rowId("X TOURS SAS", "16-30", 5, 2026)]: { estado: "APROBADO", totalEmpleados: 8, sinNovedades: true, enviadoPor: "Cliente - X Tours", fechaEnvio: "2026-05-17" },
  [rowId("DIAZAR LTDA", "16-30", 5, 2026)]: { estado: "APROBADO", totalEmpleados: 5, enviadoPor: "Cliente - Diazar", fechaEnvio: "2026-05-19" },
  [rowId("TEXTILES DEL NORTE SAS", "16-30", 5, 2026)]: { estado: "APROBADO", totalEmpleados: 15, enviadoPor: "Cliente - Textiles Norte", fechaEnvio: "2026-05-18" },
  [rowId("INVERSIONES CASTILLO SAS", "mensual", 5, 2026)]: { estado: "ENVIADO", totalEmpleados: 12, enviadoPor: "Cliente - Castillo", fechaEnvio: "2026-05-20" },
  [rowId("COMERCIAL TORRES LTDA", "16-30", 5, 2026)]: { estado: "APROBADO", totalEmpleados: 7, sinNovedades: true, enviadoPor: "Cliente - C. Torres", fechaEnvio: "2026-05-17" },
  [rowId("LOGÍSTICA ANDINA SAS", "16-30", 5, 2026)]: { estado: "REVISADO", totalEmpleados: 20, enviadoPor: "Cliente - L. Andina", fechaEnvio: "2026-05-20" },
  [rowId("CONSTRUCTORA CIMA SAS", "16-30", 5, 2026)]: { estado: "APROBADO", totalEmpleados: 25, enviadoPor: "Cliente - C. Cima", fechaEnvio: "2026-05-18" },
  // Mayo 2026 — 1ra quincena
  [rowId("300 HILOS SAS", "1-15", 5, 2026)]: { estado: "APROBADO", totalEmpleados: 10, enviadoPor: "Cliente - 300 Hilos", fechaEnvio: "2026-05-05" },
  [rowId("X TOURS SAS", "1-15", 5, 2026)]: { estado: "APROBADO", totalEmpleados: 8, sinNovedades: true, enviadoPor: "Cliente - X Tours", fechaEnvio: "2026-05-04" },
  [rowId("DIAZAR LTDA", "1-15", 5, 2026)]: { estado: "APROBADO", totalEmpleados: 5, enviadoPor: "Cliente - Diazar", fechaEnvio: "2026-05-06" },
  [rowId("TEXTILES DEL NORTE SAS", "1-15", 5, 2026)]: { estado: "APROBADO", totalEmpleados: 15, enviadoPor: "Cliente - Textiles Norte", fechaEnvio: "2026-05-05" },
  [rowId("COMERCIAL TORRES LTDA", "1-15", 5, 2026)]: { estado: "APROBADO", totalEmpleados: 7, enviadoPor: "Cliente - C. Torres", fechaEnvio: "2026-05-04" },
  [rowId("LOGÍSTICA ANDINA SAS", "1-15", 5, 2026)]: { estado: "APROBADO", totalEmpleados: 20, enviadoPor: "Cliente - L. Andina", fechaEnvio: "2026-05-06" },
  [rowId("CONSTRUCTORA CIMA SAS", "1-15", 5, 2026)]: { estado: "APROBADO", totalEmpleados: 25, enviadoPor: "Cliente - C. Cima", fechaEnvio: "2026-05-05" },
};

// ── Estado config ──────────────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<
  EstadoNomina,
  { label: string; variant: "secondary" | "warning" | "info" | "success"; Icon: React.ElementType }
> = {
  BORRADOR: { label: "Borrador", variant: "secondary", Icon: FileText },
  ENVIADO:  { label: "Enviado",  variant: "warning",   Icon: Send },
  REVISADO: { label: "Revisado", variant: "info",      Icon: Eye },
  APROBADO: { label: "Aprobado", variant: "success",   Icon: CheckCircle2 },
};

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  const months = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return `${d} ${months[parseInt(m) - 1]} ${y}`;
}

function periodoLabel(p: Periodo) {
  if (p === "1-15")    return "1ra Quincena";
  if (p === "16-30")   return "2da Quincena";
  return "Mensual";
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function NominaPage() {
  // Read empresas from localStorage so newly created companies appear automatically
  const [empresasData] = useState<EmpresaMock[]>(() => {
    if (typeof window === "undefined") return EMPRESAS_MOCK;
    try {
      const stored = localStorage.getItem("empresas-data");
      return stored ? (JSON.parse(stored) as EmpresaMock[]) : EMPRESAS_MOCK;
    } catch {
      return EMPRESAS_MOCK;
    }
  });

  const [overrides, setOverrides] = useState<Record<string, Override>>(INITIAL_OVERRIDES);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem("nomina-deleted-ids");
      return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    localStorage.setItem("nomina-deleted-ids", JSON.stringify([...deletedIds]));
  }, [deletedIds]);
  const [selectedMes, setSelectedMes] = useState(6);   // Junio (current)
  const [selectedAnio] = useState(2026);
  const [empresaFilter, setEmpresaFilter] = useState("todas");
  const [periodoFilter, setPeriodoFilter] = useState<"todos" | Periodo>("todos");
  const [estadoFilter, setEstadoFilter] = useState<"todos" | EstadoNomina>("todos");

  // Generate base rows for selected month and merge with overrides
  const reportes = useMemo<ReporteNomina[]>(() => {
    return generarFilas(empresasData, selectedMes, selectedAnio).map((row) => ({
      ...row,
      ...(overrides[row.id] ?? {}),
    }));
  }, [empresasData, selectedMes, selectedAnio, overrides]);

  // Empresa list from active companies with nómina configured
  const empresasConNomina = useMemo(
    () =>
      empresasData
        .filter((e) => isActiva(e) && e.periodicidadNomina && e.periodicidadNomina !== "no_aplica")
        .map((e) => e.razonSocial)
        .sort(),
    [empresasData]
  );

  const filtered = reportes.filter((r) => {
    if (deletedIds.has(r.id)) return false;
    const matchEmpresa = empresaFilter === "todas" || r.empresa === empresaFilter;
    const matchPeriodo = periodoFilter === "todos" || r.periodo === periodoFilter;
    const matchEstado = estadoFilter === "todos" || r.estado === estadoFilter;
    return matchEmpresa && matchPeriodo && matchEstado;
  });

  const pendientes = reportes.filter((r) => r.estado === "BORRADOR").length;
  const enviados   = reportes.filter((r) => r.estado === "ENVIADO").length;
  const aprobados  = reportes.filter((r) => r.estado === "APROBADO").length;

  function handleAprobar(id: string) {
    setOverrides((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        estado: "APROBADO",
        fechaEnvio: new Date().toISOString().split("T")[0],
      },
    }));
  }

  function handleEliminar(id: string) {
    setDeletedIds((prev) => new Set([...prev, id]));
  }

  function goMes(delta: number) {
    setSelectedMes((m) => {
      const next = m + delta;
      if (next < 1) return 12;
      if (next > 12) return 1;
      return next;
    });
    setPeriodoFilter("todos");
    setEmpresaFilter("todas");
    setEstadoFilter("todos");
    setDeletedIds(new Set());
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/25">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Novedades de Nómina</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {empresasConNomina.length} empresa{empresasConNomina.length !== 1 ? "s" : ""} con nómina configurada
            </p>
          </div>
        </div>

        {/* Month navigator */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
          <button
            onClick={() => goMes(-1)}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors text-gray-500"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-gray-900 min-w-[130px] text-center">
            {MESES[selectedMes - 1]} {selectedAnio}
          </span>
          <button
            onClick={() => goMes(1)}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors text-gray-500"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-amber-700">Pendientes</p>
              <p className="text-2xl font-bold text-amber-800">{pendientes}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100">
              <Send className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-blue-700">Enviados</p>
              <p className="text-2xl font-bold text-blue-800">{enviados}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-green-700">Aprobados</p>
              <p className="text-2xl font-bold text-green-800">{aprobados}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={empresaFilter} onValueChange={setEmpresaFilter}>
              <SelectTrigger className="w-56 h-9 text-sm">
                <SelectValue placeholder="Empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las empresas</SelectItem>
                {empresasConNomina.map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={periodoFilter}
              onValueChange={(v) => setPeriodoFilter(v as "todos" | Periodo)}
            >
              <SelectTrigger className="w-44 h-9 text-sm">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los períodos</SelectItem>
                <SelectItem value="1-15">1ra Quincena (1–15)</SelectItem>
                <SelectItem value="16-30">2da Quincena (16–30)</SelectItem>
                <SelectItem value="mensual">Mensual</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={estadoFilter}
              onValueChange={(v) => setEstadoFilter(v as "todos" | EstadoNomina)}
            >
              <SelectTrigger className="w-36 h-9 text-sm">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="BORRADOR">Borrador</SelectItem>
                <SelectItem value="ENVIADO">Enviado</SelectItem>
                <SelectItem value="REVISADO">Revisado</SelectItem>
                <SelectItem value="APROBADO">Aprobado</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex-1" />
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-900">{filtered.length}</span> reporte
              {filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pending Alert */}
      {pendientes > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700">
            Hay <span className="font-bold">{pendientes}</span> reporte
            {pendientes !== 1 ? "s" : ""} pendiente{pendientes !== 1 ? "s" : ""} de envío en{" "}
            <span className="font-bold">{MESES[selectedMes - 1]} {selectedAnio}</span>.
          </p>
        </div>
      )}

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Empresa
                </th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Período
                </th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Mes / Año
                </th>
                <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Empleados
                </th>
                <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Sin Novedades
                </th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Enviado Por
                </th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Fecha Envío
                </th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((r, idx) => {
                const estadoCfg = ESTADO_CONFIG[r.estado];
                const EstadoIcon = estadoCfg.Icon;
                return (
                  <tr
                    key={r.id}
                    className={`hover:bg-indigo-50/30 transition-colors ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 shrink-0">
                          <Users className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900 text-sm block">
                            {r.empresa}
                          </span>
                          <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                            {r.periodicidadNomina === "quincenal" ? "Quincenal" : "Mensual"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center text-xs font-medium text-gray-700 bg-gray-100 rounded-full px-2.5 py-0.5">
                        {periodoLabel(r.periodo)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-600">
                      {MESES[r.mes - 1]} {r.anio}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <Badge variant={estadoCfg.variant} className="gap-1 text-xs">
                        <EstadoIcon className="w-3 h-3" />
                        {estadoCfg.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="text-sm font-semibold text-gray-700">
                        {r.totalEmpleados > 0 ? r.totalEmpleados : <span className="text-gray-300">—</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {r.sinNovedades ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-gray-300 text-lg leading-none">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-600">
                      {r.enviadoPor ?? <span className="text-gray-400 italic">Pendiente</span>}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-600">
                      {r.fechaEnvio ? formatDate(r.fechaEnvio) : <span className="text-gray-400 italic">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/nomina/${r.empresaSlug}/${r.periodo}?mes=${r.mes}&anio=${r.anio}&empresa=${encodeURIComponent(r.empresa)}`}
                        >
                          <button
                            className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Ver / Editar"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </Link>
                        {r.estado !== "APROBADO" && (
                          <button
                            onClick={() => handleAprobar(r.id)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                            title="Aprobar"
                          >
                            <ThumbsUp className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Exportar"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEliminar(r.id)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Eliminar fila"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No se encontraron reportes</p>
              <p className="text-gray-400 text-sm mt-1">Intenta con otros filtros</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
