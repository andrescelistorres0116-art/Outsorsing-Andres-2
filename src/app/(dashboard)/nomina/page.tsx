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
  AlertCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Undo2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppSession } from "@/hooks/useAppSession";

// ── Types aligned with Prisma enums ───────────────────────────────────────────

type EstadoReporte = "BORRADOR" | "ENVIADA" | "REVISADA" | "APROBADA" | "REABIERTA" | "CORREGIDA";
type PeriodoNomina = "MENSUAL" | "PRIMERA_QUINCENA" | "SEGUNDA_QUINCENA";

interface ReporteItem {
  id: string;
  empresaId: string;
  empresa: { id: string; razonSocial: string; nit: string; nombreComercial?: string | null };
  periodo: PeriodoNomina;
  mes: number;
  año: number;
  estado: EstadoReporte;
  sinNovedades: boolean;
  enviadoPor: { id: string; name: string } | null;
  aprobadoPor: { id: string; name: string } | null;
  fechaEnvio: string | null;
  fechaAprobacion: string | null;
  _count?: { novedades: number };
}

interface EmpresaOpcion {
  id: string;
  razonSocial: string;
  estado: string;
  periodicidadNomina?: string | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const ESTADO_CONFIG: Record<
  EstadoReporte,
  { label: string; variant: "secondary" | "warning" | "info" | "success"; Icon: React.ElementType }
> = {
  BORRADOR:  { label: "Borrador",  variant: "secondary", Icon: FileText },
  ENVIADA:   { label: "Enviada",   variant: "warning",   Icon: Send },
  REVISADA:  { label: "Revisada",  variant: "info",      Icon: Eye },
  APROBADA:  { label: "Aprobada",  variant: "success",   Icon: CheckCircle2 },
  REABIERTA: { label: "Reabierta", variant: "warning",   Icon: Undo2 },
  CORREGIDA: { label: "Corregida", variant: "info",      Icon: RefreshCw },
};

function periodoLabel(p: PeriodoNomina) {
  if (p === "PRIMERA_QUINCENA") return "1ra Quincena";
  if (p === "SEGUNDA_QUINCENA") return "2da Quincena";
  return "Mensual";
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  const months = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function NominaPage() {
  const { appSession } = useAppSession();

  const TODAY_MES = new Date().getMonth() + 1;
  const TODAY_ANIO = new Date().getFullYear();

  const [activeTab, setActiveTab] = useState<"actual" | "historico">("actual");
  const [histMes, setHistMes] = useState(TODAY_MES === 1 ? 12 : TODAY_MES - 1);
  const [histAnio, setHistAnio] = useState(TODAY_MES === 1 ? TODAY_ANIO - 1 : TODAY_ANIO);

  const selectedMes = activeTab === "actual" ? TODAY_MES : histMes;
  const selectedAnio = activeTab === "actual" ? TODAY_ANIO : histAnio;

  const [reportes, setReportes] = useState<ReporteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [empresas, setEmpresas] = useState<EmpresaOpcion[]>([]);

  const [empresaFilter, setEmpresaFilter] = useState("todas");
  const [periodoFilter, setPeriodoFilter] = useState<"todos" | PeriodoNomina>("todos");
  const [estadoFilter, setEstadoFilter] = useState<"todos" | EstadoReporte>("todos");

  // Create-report modal state (admin/contador only)
  const [showCrear, setShowCrear] = useState(false);
  const [crearEmpresaId, setCrearEmpresaId] = useState("");
  const [crearPeriodo, setCrearPeriodo] = useState<PeriodoNomina>("MENSUAL");
  const [crearError, setCrearError] = useState("");
  const [crearLoading, setCrearLoading] = useState(false);

  // Load reportes when month changes
  useEffect(() => {
    setLoading(true);
    fetch(`/api/nomina/reportes?mes=${selectedMes}&año=${selectedAnio}&limit=100`)
      .then((r) => r.json())
      .then((data) => setReportes(Array.isArray(data.reportes) ? data.reportes : []))
      .catch(() => setReportes([]))
      .finally(() => setLoading(false));
  }, [selectedMes, selectedAnio]);

  // Load empresas for filter/create dropdowns
  useEffect(() => {
    fetch("/api/app-empresas")
      .then((r) => r.json())
      .then((data) => setEmpresas(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const empresasActivas = empresas.filter((e) => e.estado === "ACTIVA");

  // Rows visible to current user
  const filtered = useMemo(() => {
    return reportes.filter((r) => {
      if (appSession?.role === "cliente" && !appSession.empresaIds.includes(r.empresaId)) return false;
      if (empresaFilter !== "todas" && r.empresaId !== empresaFilter) return false;
      if (periodoFilter !== "todos" && r.periodo !== periodoFilter) return false;
      if (estadoFilter !== "todos" && r.estado !== estadoFilter) return false;
      return true;
    });
  }, [reportes, appSession, empresaFilter, periodoFilter, estadoFilter]);

  const visibleReportes = useMemo(() => {
    if (appSession?.role !== "cliente") return reportes;
    return reportes.filter((r) => appSession.empresaIds.includes(r.empresaId));
  }, [reportes, appSession]);

  const pendientes = visibleReportes.filter((r) => r.estado === "BORRADOR" || r.estado === "REABIERTA").length;
  const aprobados = visibleReportes.filter((r) => r.estado === "APROBADA").length;

  async function reloadReportes() {
    const data = await fetch(`/api/nomina/reportes?mes=${selectedMes}&año=${selectedAnio}&limit=100`).then((r) => r.json());
    setReportes(data.reportes ?? []);
  }

  async function handleCrearReporte() {
    if (!crearEmpresaId) { setCrearError("Selecciona una empresa"); return; }
    setCrearLoading(true);
    setCrearError("");
    const res = await fetch("/api/nomina/reportes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ empresaId: crearEmpresaId, periodo: crearPeriodo, mes: selectedMes, año: selectedAnio }),
    });
    setCrearLoading(false);
    if (res.ok) {
      setShowCrear(false);
      setCrearEmpresaId("");
      await reloadReportes();
    } else {
      const err = await res.json().catch(() => ({}));
      setCrearError(err.error ?? "Error al crear reporte");
    }
  }

  // Derive available periodos for selected empresa (based on periodicidadNomina)
  const crearPeriodosDisponibles = useMemo<PeriodoNomina[]>(() => {
    const emp = empresasActivas.find((e) => e.id === crearEmpresaId);
    if (!emp) return ["MENSUAL", "PRIMERA_QUINCENA", "SEGUNDA_QUINCENA"];
    if (emp.periodicidadNomina === "QUINCENAL" || emp.periodicidadNomina === "quincenal") {
      return ["PRIMERA_QUINCENA", "SEGUNDA_QUINCENA"];
    }
    return ["MENSUAL"];
  }, [crearEmpresaId, empresasActivas]);

  function goHistMes(delta: number) {
    let newMes = histMes + delta;
    let newAnio = histAnio;
    if (newMes < 1)  { newMes = 12; newAnio--; }
    if (newMes > 12) { newMes = 1;  newAnio++; }
    if (newAnio > TODAY_ANIO || (newAnio === TODAY_ANIO && newMes >= TODAY_MES)) return;
    setHistMes(newMes);
    setHistAnio(newAnio);
    setPeriodoFilter("todos");
    setEmpresaFilter("todas");
    setEstadoFilter("todos");
  }

  function switchTab(tab: "actual" | "historico") {
    setActiveTab(tab);
    setPeriodoFilter("todos");
    setEmpresaFilter("todas");
    setEstadoFilter("todos");
  }

  // Build empresa options for filter, limited to what the user can access
  const empresasParaFiltro = useMemo(() => {
    const idsEnReportes = new Set(reportes.map((r) => r.empresaId));
    return reportes
      .filter((r) => idsEnReportes.has(r.empresaId))
      .map((r) => ({ id: r.empresaId, nombre: r.empresa.razonSocial }))
      .filter((e, i, arr) => arr.findIndex((x) => x.id === e.id) === i)
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [reportes]);

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
              {filtered.length} reporte{filtered.length !== 1 ? "s" : ""} — {MESES[selectedMes - 1]} {selectedAnio}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Admin/Contador: create new report */}
          {appSession?.role !== "cliente" && (
            <Button
              onClick={() => { setShowCrear(true); setCrearError(""); setCrearEmpresaId(""); setCrearPeriodo("MENSUAL"); }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              Crear Reporte
            </Button>
          )}

          {/* Month badge (actual) / navigator (historico) */}
          {activeTab === "actual" ? (
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2">
              <span className="text-sm font-semibold text-indigo-700">
                {MESES[TODAY_MES - 1]} {TODAY_ANIO}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
              <button
                onClick={() => goHistMes(-1)}
                className="p-1 rounded-md hover:bg-gray-100 transition-colors text-gray-500"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-gray-900 min-w-[130px] text-center">
                {MESES[histMes - 1]} {histAnio}
              </span>
              <button
                onClick={() => goHistMes(1)}
                disabled={histAnio > TODAY_ANIO || (histAnio === TODAY_ANIO && histMes >= TODAY_MES - 1)}
                className="p-1 rounded-md hover:bg-gray-100 transition-colors text-gray-500 disabled:text-gray-200 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(["actual", "historico"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => switchTab(tab)}
            className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab === "actual" ? "Mes Actual" : "Histórico"}
          </button>
        ))}
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
              <p className="text-xs font-medium text-blue-700">En Proceso</p>
              <p className="text-2xl font-bold text-blue-800">
                {visibleReportes.filter((r) => r.estado === "ENVIADA" || r.estado === "REVISADA" || r.estado === "CORREGIDA").length}
              </p>
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
                {empresasParaFiltro.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={periodoFilter}
              onValueChange={(v) => setPeriodoFilter(v as "todos" | PeriodoNomina)}
            >
              <SelectTrigger className="w-48 h-9 text-sm">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los períodos</SelectItem>
                <SelectItem value="PRIMERA_QUINCENA">1ra Quincena</SelectItem>
                <SelectItem value="SEGUNDA_QUINCENA">2da Quincena</SelectItem>
                <SelectItem value="MENSUAL">Mensual</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={estadoFilter}
              onValueChange={(v) => setEstadoFilter(v as "todos" | EstadoReporte)}
            >
              <SelectTrigger className="w-36 h-9 text-sm">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="BORRADOR">Borrador</SelectItem>
                <SelectItem value="ENVIADA">Enviada</SelectItem>
                <SelectItem value="REVISADA">Revisada</SelectItem>
                <SelectItem value="APROBADA">Aprobada</SelectItem>
                <SelectItem value="REABIERTA">Reabierta</SelectItem>
                <SelectItem value="CORREGIDA">Corregida</SelectItem>
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

      {/* Pending alert */}
      {pendientes > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700">
            Hay <span className="font-bold">{pendientes}</span> reporte
            {pendientes !== 1 ? "s" : ""} pendiente{pendientes !== 1 ? "s" : ""} en{" "}
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
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Empresa</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Período</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mes / Año</th>
                <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sin Novedades</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aprobado Por</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha Aprobación</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-sm text-gray-400">
                    Cargando reportes...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    {appSession?.role === "cliente" ? (
                      <>
                        <p className="text-gray-500 font-medium">No hay reportes disponibles para este período</p>
                        <p className="text-gray-400 text-sm mt-1">El contador aún no ha creado los reportes de este mes.</p>
                      </>
                    ) : (
                      <>
                        <p className="text-gray-500 font-medium">No hay reportes para este período</p>
                        <p className="text-gray-400 text-sm mt-1">
                          Usa <span className="font-semibold text-indigo-600">Crear Reporte</span> para agregar uno.
                        </p>
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((r, idx) => {
                  const cfg = ESTADO_CONFIG[r.estado];
                  const Icon = cfg.Icon;
                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-indigo-50/30 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 shrink-0">
                            <Users className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900 text-sm block">
                              {r.empresa.nombreComercial ?? r.empresa.razonSocial}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">{r.empresa.nit}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center text-xs font-medium text-gray-700 bg-gray-100 rounded-full px-2.5 py-0.5">
                          {periodoLabel(r.periodo)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-600">
                        {MESES[r.mes - 1]} {r.año}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Badge variant={cfg.variant} className="gap-1 text-xs">
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {r.sinNovedades ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                        ) : (
                          <span className="text-gray-300 text-lg leading-none">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-600">
                        {r.aprobadoPor?.name ?? <span className="text-gray-400 italic">Pendiente</span>}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-600">
                        {formatDate(r.fechaAprobacion) ?? <span className="text-gray-400 italic">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/nomina/${r.id}`}>
                            <button
                              className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="Ver / Editar"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>
                          {appSession?.role !== "cliente" && (
                            <button
                              className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Exportar"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Crear Reporte Modal */}
      <Dialog open={showCrear} onOpenChange={(o) => { if (!o) setShowCrear(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-gray-900">Crear Reporte de Nómina</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {MESES[selectedMes - 1]} {selectedAnio}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Empresa</label>
              <Select value={crearEmpresaId} onValueChange={(v) => { setCrearEmpresaId(v); setCrearPeriodo("MENSUAL"); }}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Selecciona una empresa" />
                </SelectTrigger>
                <SelectContent>
                  {empresasActivas.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.razonSocial}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Período</label>
              <Select value={crearPeriodo} onValueChange={(v) => setCrearPeriodo(v as PeriodoNomina)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {crearPeriodosDisponibles.map((p) => (
                    <SelectItem key={p} value={p}>{periodoLabel(p)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {crearError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {crearError}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCrear(false)}>Cancelar</Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={handleCrearReporte}
              disabled={crearLoading || !crearEmpresaId}
            >
              {crearLoading ? "Creando..." : "Crear Reporte"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
