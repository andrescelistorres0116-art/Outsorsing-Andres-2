"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  AlertTriangle,
  Clock,
  Users,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Plus,
  Calendar,
  FileText,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { OBLIGACIONES_MOCK } from "@/components/calendario/mockData";
import type { EmpresaMock } from "@/lib/empresas-mock";
import { EMPRESAS_MOCK } from "@/lib/empresas-mock";

// ── Helpers ────────────────────────────────────────────────────────────────────

function normName(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function matchesName(a: string, b: string): boolean {
  const na = normName(a);
  const nb = normName(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}

function daysFromNow(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  return Math.round((target.getTime() - now.getTime()) / 86_400_000);
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function shortEmpresaName(name: string): string {
  const stop = new Set(["SAS", "LTDA", "SA", "S.A.S.", "S.A.", "INC"]);
  const words = name.split(" ").filter((w) => !stop.has(w.toUpperCase()));
  return words.slice(0, 2).join(" ");
}

function getDiasBadge(dias: number) {
  const base =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border";
  const label = dias === 0 ? "hoy" : `${Math.abs(dias)}d`;
  if (dias <= 0)
    return (
      <span className={`${base} bg-red-100 text-red-800 border-red-200`}>
        {label}
      </span>
    );
  if (dias <= 3)
    return (
      <span
        className={`${base} bg-orange-100 text-orange-800 border-orange-200`}
      >
        {label}
      </span>
    );
  if (dias <= 7)
    return (
      <span
        className={`${base} bg-yellow-100 text-yellow-800 border-yellow-200`}
      >
        {label}
      </span>
    );
  return (
    <span className={`${base} bg-green-100 text-green-800 border-green-200`}>
      {label}
    </span>
  );
}

function getEstadoBadge(dias: number, estado: string) {
  if (dias <= 0 || estado === "VENCIDO")
    return (
      <Badge variant="destructive" className="text-xs">
        Vencida
      </Badge>
    );
  if (dias <= 3)
    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
        Urgente
      </span>
    );
  if (dias <= 7)
    return (
      <Badge variant="warning" className="text-xs">
        Próxima
      </Badge>
    );
  return (
    <Badge variant="success" className="text-xs">
      Al día
    </Badge>
  );
}

function getBarColor(value: number) {
  if (value >= 90) return "#16a34a";
  if (value >= 75) return "#2563eb";
  if (value >= 60) return "#d97706";
  return "#dc2626";
}



// ── Stat Card ──────────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  href?: string;
}

function StatCard({
  title,
  value,
  sub,
  icon,
  color,
  bgColor,
  href,
}: StatCardProps) {
  const inner = (
    <Card
      className={`relative overflow-hidden transition-shadow ${href ? "hover:shadow-md cursor-pointer" : ""}`}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            <p className={`text-sm font-medium ${color}`}>{sub}</p>
          </div>
          <div
            className={`flex items-center justify-center w-12 h-12 rounded-xl ${bgColor}`}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2">
        <p className="text-xs font-semibold text-gray-700">{label}</p>
        <p className="text-sm font-bold text-gray-900">{payload[0].value}%</p>
      </div>
    );
  }
  return null;
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [empresas, setEmpresas] = useState<EmpresaMock[]>([]);
  const [empresasLoaded, setEmpresasLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/app-empresas")
      .then(async (r) => {
        if (r.status === 200) {
          const data: EmpresaMock[] = await r.json();
          if (Array.isArray(data)) setEmpresas(data);
        }
        // 204 = not yet initialized, leave empresas as []
      })
      .catch(() => {})
      .finally(() => setEmpresasLoaded(true));
  }, []);

  const activeEmpresas = useMemo(
    () => empresas.filter((e) => e.estado === "ACTIVA"),
    [empresas]
  );

  // Normalized names of ACTIVA empresas — only obligations matching these are shown.
  const activaNames = useMemo(
    () => new Set(activeEmpresas.map((e) => normName(e.razonSocial))),
    [activeEmpresas]
  );

  // Only show obligations for ACTIVA empresas in the store.
  // While loading (empresasLoaded=false) show nothing to avoid flash of mock data.
  const visibleObligaciones = useMemo(() => {
    if (!empresasLoaded) return [];
    if (activaNames.size === 0) return [];
    return OBLIGACIONES_MOCK.filter((o) =>
      [...activaNames].some((name) => matchesName(o.empresa, name))
    );
  }, [activaNames, empresasLoaded]);

  // Pending/overdue obligations sorted by date (top 8)
  const upcoming = useMemo(() => {
    return visibleObligaciones
      .filter((o) => o.estado !== "PAGADO" && o.estado !== "PRESENTADO")
      .sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento))
      .slice(0, 8);
  }, [visibleObligaciones]);

  // KPI: overdue count
  const countVencidas = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return visibleObligaciones.filter(
      (o) =>
        o.estado === "VENCIDO" ||
        (o.estado !== "PAGADO" &&
          o.estado !== "PRESENTADO" &&
          new Date(o.fechaVencimiento + "T00:00:00") < now)
    ).length;
  }, [visibleObligaciones]);

  // KPI: due within 7 days (not completed, not vencidas)
  const countSemana = useMemo(() => {
    return visibleObligaciones.filter((o) => {
      if (
        o.estado === "PAGADO" ||
        o.estado === "PRESENTADO" ||
        o.estado === "VENCIDO"
      )
        return false;
      const d = daysFromNow(o.fechaVencimiento);
      return d >= 0 && d <= 7;
    }).length;
  }, [visibleObligaciones]);

  // KPI: active empresas with payroll enabled
  const countNomina = useMemo(
    () =>
      activeEmpresas.filter(
        (e) => e.periodicidadNomina && e.periodicidadNomina !== "no_aplica"
      ).length,
    [activeEmpresas]
  );

  // Compliance chart: % of past-due obligations filed/paid per empresa
  // Formula: (PRESENTADO + PAGADO) / total past-due × 100
  const complianceData = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const byEmpresa = new Map<string, { total: number; completed: number }>();

    for (const o of visibleObligaciones) {
      const fecha = new Date(o.fechaVencimiento + "T00:00:00");
      if (fecha >= now) continue; // only count obligations that were already due
      if (!byEmpresa.has(o.empresa))
        byEmpresa.set(o.empresa, { total: 0, completed: 0 });
      const entry = byEmpresa.get(o.empresa)!;
      entry.total++;
      if (o.estado === "PAGADO" || o.estado === "PRESENTADO") entry.completed++;
    }

    return Array.from(byEmpresa.entries())
      .filter(([, v]) => v.total > 0)
      .map(([empresa, v]) => ({
        empresa: shortEmpresaName(empresa),
        cumplimiento: Math.round((v.completed / v.total) * 100),
        fullName: empresa,
      }))
      .sort((a, b) => b.cumplimiento - a.cumplimiento);
  }, [visibleObligaciones]);

  // Empresas recientes: last 3 active by id (most recently added)
  const empresasRecientes = useMemo(
    () => [...activeEmpresas].sort((a, b) => b.id - a.id).slice(0, 3),
    [activeEmpresas]
  );

  const now = new Date();
  const mesLabel = now
    .toLocaleString("es-CO", { month: "long", year: "numeric" })
    .replace(/^\w/, (c) => c.toUpperCase());

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Resumen ejecutivo · Outsoursing Andrés · {mesLabel}
          </p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-gray-500 bg-white border border-gray-200 rounded-full px-3 py-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Sincronizado
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Empresas Activas"
          value={String(activeEmpresas.length || "—")}
          sub="empresas"
          icon={<Building2 className="w-6 h-6 text-green-600" />}
          color="text-green-600"
          bgColor="bg-green-50"
          href="/empresas"
        />
        <StatCard
          title="Obligaciones Vencidas"
          value={String(countVencidas)}
          sub="requieren atención"
          icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
          color="text-red-600"
          bgColor="bg-red-50"
          href="/calendario"
        />
        <StatCard
          title="Vencen Esta Semana"
          value={String(countSemana)}
          sub="próximas a vencer"
          icon={<Clock className="w-6 h-6 text-orange-600" />}
          color="text-orange-600"
          bgColor="bg-orange-50"
          href="/calendario"
        />
        <StatCard
          title="Empresas con Nómina"
          value={String(countNomina)}
          sub="requieren seguimiento"
          icon={<Users className="w-6 h-6 text-blue-600" />}
          color="text-blue-600"
          bgColor="bg-blue-50"
          href="/nomina"
        />
      </div>

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Obligaciones próximas (2/3) */}
        <div className="xl:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Obligaciones Próximas</CardTitle>
                  <CardDescription className="mt-1">
                    Solo empresas activas · ordenadas por fecha de vencimiento
                  </CardDescription>
                </div>
                <Link href="/calendario">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                    Ver todo <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {upcoming.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  Sin obligaciones pendientes
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Empresa
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Obligación
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Vence
                        </th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Días
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {upcoming.map((o) => {
                        const dias = daysFromNow(o.fechaVencimiento);
                        return (
                          <tr
                            key={o.id}
                            className="hover:bg-gray-50/80 transition-colors"
                          >
                            <td className="px-6 py-3.5">
                              <span className="font-medium text-gray-900 text-xs">
                                {o.empresa}
                              </span>
                            </td>
                            <td className="px-6 py-3.5 text-gray-600 text-xs">
                              {o.tipoObligacion}
                            </td>
                            <td className="px-4 py-3.5 text-gray-600 text-xs whitespace-nowrap">
                              {formatDate(o.fechaVencimiento)}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              {getDiasBadge(dias)}
                            </td>
                            <td className="px-6 py-3.5 text-right">
                              {getEstadoBadge(dias, o.estado)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column (1/3) */}
        <div className="space-y-5">
          {/* Empresas recientes */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Empresas Recientes</CardTitle>
                <Link href="/empresas">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-blue-600 hover:text-blue-700 h-7 px-2"
                  >
                    Ver todas
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {empresasRecientes.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-3">
                  Sin empresas registradas
                </p>
              ) : (
                empresasRecientes.map((e) => (
                  <Link key={e.id} href={`/empresas/${e.id}`}>
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group">
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 shrink-0">
                        <Building2 className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">
                          {e.razonSocial}
                        </p>
                        <p className="text-xs text-gray-400">
                          {e.nit} · {e.ciudad}
                        </p>
                      </div>
                      <Badge
                        variant={e.estado === "ACTIVA" ? "success" : "secondary"}
                        className="text-xs shrink-0"
                      >
                        {e.estado}
                      </Badge>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Compliance chart (2/3) */}
        <Card className="xl:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <div>
                <CardTitle>Indicador de Cumplimiento</CardTitle>
                <CardDescription className="mt-0.5">
                  % de obligaciones radicadas/pagadas a tiempo · solo vencidas
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {complianceData.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">
                Sin datos de cumplimiento disponibles
              </p>
            ) : (
              <>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={complianceData}
                      margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f1f5f9"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="empresa"
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: "#f8fafc" }}
                      />
                      <Bar dataKey="cumplimiento" radius={[4, 4, 0, 0]}>
                        {complianceData.map((entry, index) => (
                          <Cell
                            key={index}
                            fill={getBarColor(entry.cumplimiento)}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-5 mt-3 pt-3 border-t border-gray-100">
                  {[
                    { color: "bg-green-500", label: "≥ 90% Excelente" },
                    { color: "bg-blue-500", label: "75–89% Bueno" },
                    { color: "bg-amber-500", label: "60–74% Regular" },
                    { color: "bg-red-500", label: "< 60% Crítico" },
                  ].map((l) => (
                    <div key={l.label} className="flex items-center gap-1.5">
                      <div className={`w-2.5 h-2.5 rounded-sm ${l.color}`} />
                      <span className="text-[11px] text-gray-500">
                        {l.label}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Quick actions (1/3) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-0">
            <Link href="/empresas">
              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all cursor-pointer group">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-100 shrink-0">
                  <Plus className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-700">
                    Nueva Empresa
                  </p>
                  <p className="text-xs text-gray-400">Registrar cliente</p>
                </div>
              </div>
            </Link>
            <Link href="/calendario">
              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/50 transition-all cursor-pointer group">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-purple-100 shrink-0">
                  <Calendar className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-purple-700">
                    Nueva Obligación
                  </p>
                  <p className="text-xs text-gray-400">Agregar al calendario</p>
                </div>
              </div>
            </Link>
            <Link href="/nomina">
              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50/50 transition-all cursor-pointer group">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-green-100 shrink-0">
                  <FileText className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-green-700">
                    Reportar Novedad
                  </p>
                  <p className="text-xs text-gray-400">Nómina electrónica</p>
                </div>
              </div>
            </Link>
            <div className="mt-1 pt-3 border-t border-gray-100">
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                {complianceData.filter((c) => c.cumplimiento >= 90).length} empresa
                {complianceData.filter((c) => c.cumplimiento >= 90).length !== 1
                  ? "s"
                  : ""}{" "}
                con cumplimiento ≥ 90%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
