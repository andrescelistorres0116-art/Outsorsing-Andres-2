"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  Clock,
  CheckCircle2,
  Send,
  Eye,
  Pencil,
  Download,
  ThumbsUp,
  AlertCircle,
  FileText,
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

// ── Types ──────────────────────────────────────────────────────────────────────

type EstadoNomina = "BORRADOR" | "ENVIADO" | "REVISADO" | "APROBADO";
type Periodo = "1-15" | "16-30";

interface ReporteNomina {
  id: number;
  empresaId: string;
  empresa: string;
  periodo: Periodo;
  mes: number;
  anio: number;
  estado: EstadoNomina;
  totalEmpleados: number;
  sinNovedades: boolean;
  enviadoPor?: string;
  fechaEnvio?: string;
}

// ── Mock Data ──────────────────────────────────────────────────────────────────

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const REPORTES: ReporteNomina[] = [
  // Junio 2026 - primera quincena
  {
    id: 1,
    empresaId: "300-hilos",
    empresa: "300 HILOS SAS",
    periodo: "1-15",
    mes: 6,
    anio: 2026,
    estado: "ENVIADO",
    totalEmpleados: 10,
    sinNovedades: false,
    enviadoPor: "Cliente - 300 Hilos",
    fechaEnvio: "2026-06-02",
  },
  {
    id: 2,
    empresaId: "x-tours",
    empresa: "X TOURS SAS",
    periodo: "1-15",
    mes: 6,
    anio: 2026,
    estado: "APROBADO",
    totalEmpleados: 8,
    sinNovedades: true,
    enviadoPor: "Cliente - X Tours",
    fechaEnvio: "2026-06-01",
  },
  {
    id: 3,
    empresaId: "diazar",
    empresa: "DIAZAR LTDA",
    periodo: "1-15",
    mes: 6,
    anio: 2026,
    estado: "BORRADOR",
    totalEmpleados: 5,
    sinNovedades: false,
  },
  {
    id: 4,
    empresaId: "textiles-norte",
    empresa: "TEXTILES DEL NORTE SAS",
    periodo: "1-15",
    mes: 6,
    anio: 2026,
    estado: "REVISADO",
    totalEmpleados: 15,
    sinNovedades: false,
    enviadoPor: "Cliente - Textiles Norte",
    fechaEnvio: "2026-06-02",
  },
  {
    id: 5,
    empresaId: "inversiones-castillo",
    empresa: "INVERSIONES CASTILLO SAS",
    periodo: "1-15",
    mes: 6,
    anio: 2026,
    estado: "BORRADOR",
    totalEmpleados: 12,
    sinNovedades: false,
  },
  {
    id: 6,
    empresaId: "comercial-torres",
    empresa: "COMERCIAL TORRES LTDA",
    periodo: "1-15",
    mes: 6,
    anio: 2026,
    estado: "ENVIADO",
    totalEmpleados: 7,
    sinNovedades: true,
    enviadoPor: "Cliente - C. Torres",
    fechaEnvio: "2026-06-03",
  },
  {
    id: 7,
    empresaId: "logistica-andina",
    empresa: "LOGÍSTICA ANDINA SAS",
    periodo: "1-15",
    mes: 6,
    anio: 2026,
    estado: "BORRADOR",
    totalEmpleados: 20,
    sinNovedades: false,
  },
  {
    id: 8,
    empresaId: "constructora-cima",
    empresa: "CONSTRUCTORA CIMA SAS",
    periodo: "1-15",
    mes: 6,
    anio: 2026,
    estado: "APROBADO",
    totalEmpleados: 25,
    sinNovedades: false,
    enviadoPor: "Cliente - C. Cima",
    fechaEnvio: "2026-06-01",
  },
  // Mayo 2026 - segunda quincena
  {
    id: 9,
    empresaId: "300-hilos",
    empresa: "300 HILOS SAS",
    periodo: "16-30",
    mes: 5,
    anio: 2026,
    estado: "APROBADO",
    totalEmpleados: 10,
    sinNovedades: false,
    enviadoPor: "Cliente - 300 Hilos",
    fechaEnvio: "2026-05-18",
  },
  {
    id: 10,
    empresaId: "x-tours",
    empresa: "X TOURS SAS",
    periodo: "16-30",
    mes: 5,
    anio: 2026,
    estado: "APROBADO",
    totalEmpleados: 8,
    sinNovedades: true,
    enviadoPor: "Cliente - X Tours",
    fechaEnvio: "2026-05-17",
  },
  {
    id: 11,
    empresaId: "diazar",
    empresa: "DIAZAR LTDA",
    periodo: "16-30",
    mes: 5,
    anio: 2026,
    estado: "APROBADO",
    totalEmpleados: 5,
    sinNovedades: false,
    enviadoPor: "Cliente - Diazar",
    fechaEnvio: "2026-05-19",
  },
  {
    id: 12,
    empresaId: "textiles-norte",
    empresa: "TEXTILES DEL NORTE SAS",
    periodo: "16-30",
    mes: 5,
    anio: 2026,
    estado: "APROBADO",
    totalEmpleados: 15,
    sinNovedades: false,
    enviadoPor: "Cliente - Textiles Norte",
    fechaEnvio: "2026-05-18",
  },
  {
    id: 13,
    empresaId: "inversiones-castillo",
    empresa: "INVERSIONES CASTILLO SAS",
    periodo: "16-30",
    mes: 5,
    anio: 2026,
    estado: "ENVIADO",
    totalEmpleados: 12,
    sinNovedades: false,
    enviadoPor: "Cliente - Castillo",
    fechaEnvio: "2026-05-20",
  },
  {
    id: 14,
    empresaId: "comercial-torres",
    empresa: "COMERCIAL TORRES LTDA",
    periodo: "16-30",
    mes: 5,
    anio: 2026,
    estado: "APROBADO",
    totalEmpleados: 7,
    sinNovedades: true,
    enviadoPor: "Cliente - C. Torres",
    fechaEnvio: "2026-05-17",
  },
  {
    id: 15,
    empresaId: "logistica-andina",
    empresa: "LOGÍSTICA ANDINA SAS",
    periodo: "16-30",
    mes: 5,
    anio: 2026,
    estado: "REVISADO",
    totalEmpleados: 20,
    sinNovedades: false,
    enviadoPor: "Cliente - L. Andina",
    fechaEnvio: "2026-05-20",
  },
  {
    id: 16,
    empresaId: "constructora-cima",
    empresa: "CONSTRUCTORA CIMA SAS",
    periodo: "16-30",
    mes: 5,
    anio: 2026,
    estado: "APROBADO",
    totalEmpleados: 25,
    sinNovedades: false,
    enviadoPor: "Cliente - C. Cima",
    fechaEnvio: "2026-05-18",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<
  EstadoNomina,
  { label: string; variant: "secondary" | "warning" | "info" | "success"; Icon: React.ElementType }
> = {
  BORRADOR: { label: "Borrador", variant: "secondary", Icon: FileText },
  ENVIADO: { label: "Enviado", variant: "warning", Icon: Send },
  REVISADO: { label: "Revisado", variant: "info", Icon: Eye },
  APROBADO: { label: "Aprobado", variant: "success", Icon: CheckCircle2 },
};

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${d} ${months[parseInt(m) - 1]} ${y}`;
}

function periodoLabel(p: Periodo) {
  return p === "1-15" ? "1ra Quincena" : "2da Quincena";
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function NominaPage() {
  const [reportes, setReportes] = useState<ReporteNomina[]>(REPORTES);
  const [empresaFilter, setEmpresaFilter] = useState("todas");
  const [periodoFilter, setPeriodoFilter] = useState<"todos" | Periodo>("todos");
  const [mesFilter, setMesFilter] = useState("todos");
  const [estadoFilter, setEstadoFilter] = useState<"todos" | EstadoNomina>("todos");

  const empresas = Array.from(new Set(REPORTES.map((r) => r.empresa))).sort();

  const filtered = reportes.filter((r) => {
    const matchEmpresa = empresaFilter === "todas" || r.empresa === empresaFilter;
    const matchPeriodo = periodoFilter === "todos" || r.periodo === periodoFilter;
    const matchMes = mesFilter === "todos" || r.mes === parseInt(mesFilter);
    const matchEstado = estadoFilter === "todos" || r.estado === estadoFilter;
    return matchEmpresa && matchPeriodo && matchMes && matchEstado;
  });

  const pendientes = reportes.filter((r) => r.estado === "BORRADOR").length;
  const enviados = reportes.filter((r) => r.estado === "ENVIADO").length;
  const aprobados = reportes.filter((r) => r.estado === "APROBADO").length;

  const handleAprobar = (id: number) => {
    setReportes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, estado: "APROBADO" as EstadoNomina } : r))
    );
  };

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
              Seguimiento de novedades quincenales por empresa
            </p>
          </div>
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
              <p className="text-xs font-medium text-amber-700">Reportes Pendientes</p>
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
              <SelectTrigger className="w-52 h-9 text-sm">
                <SelectValue placeholder="Empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las empresas</SelectItem>
                {empresas.map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={periodoFilter}
              onValueChange={(v) => setPeriodoFilter(v as "todos" | Periodo)}
            >
              <SelectTrigger className="w-40 h-9 text-sm">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los períodos</SelectItem>
                <SelectItem value="1-15">1ra Quincena (1-15)</SelectItem>
                <SelectItem value="16-30">2da Quincena (16-30)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={mesFilter} onValueChange={setMesFilter}>
              <SelectTrigger className="w-36 h-9 text-sm">
                <SelectValue placeholder="Mes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los meses</SelectItem>
                {MESES.map((m, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                ))}
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
            Hay <span className="font-bold">{pendientes}</span> empresa
            {pendientes !== 1 ? "s" : ""} con reportes de nómina pendientes de envío esta quincena.
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
                        <span className="font-semibold text-gray-900 text-sm">{r.empresa}</span>
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
                      <Badge
                        variant={estadoCfg.variant}
                        className="gap-1 text-xs"
                      >
                        <EstadoIcon className="w-3 h-3" />
                        {estadoCfg.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="text-sm font-semibold text-gray-700">{r.totalEmpleados}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {r.sinNovedades ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-gray-300 text-lg leading-none">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-600">
                      {r.enviadoPor ?? (
                        <span className="text-gray-400 italic">Pendiente</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-600">
                      {r.fechaEnvio ? formatDate(r.fechaEnvio) : (
                        <span className="text-gray-400 italic">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/nomina/${r.empresaId}/${r.periodo}?mes=${r.mes}&anio=${r.anio}&empresa=${encodeURIComponent(r.empresa)}`}
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
