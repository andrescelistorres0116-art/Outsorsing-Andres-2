"use client";

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

// ── Mock data ──────────────────────────────────────────────────────────────────

const obligaciones = [
  {
    id: 1,
    empresa: "X TOURS SAS",
    obligacion: "Retención en la Fuente",
    vence: "08/06/2026",
    dias: 5,
    estado: "naranja",
  },
  {
    id: 2,
    empresa: "DIAZAR LTDA",
    obligacion: "IVA Bimestral",
    vence: "15/06/2026",
    dias: 12,
    estado: "amarillo",
  },
  {
    id: 3,
    empresa: "300 HILOS SAS",
    obligacion: "ICA Bogotá",
    vence: "20/06/2026",
    dias: 17,
    estado: "verde",
  },
  {
    id: 4,
    empresa: "TEXTILES DEL NORTE SAS",
    obligacion: "Retención en la Fuente",
    vence: "08/06/2026",
    dias: 5,
    estado: "naranja",
  },
  {
    id: 5,
    empresa: "INVERSIONES CASTILLO",
    obligacion: "Declaración Renta",
    vence: "05/06/2026",
    dias: 2,
    estado: "rojo",
  },
  {
    id: 6,
    empresa: "COMERCIAL TORRES LTDA",
    obligacion: "IVA Bimestral",
    vence: "15/06/2026",
    dias: 12,
    estado: "amarillo",
  },
  {
    id: 7,
    empresa: "LOGISTICA ANDINA SAS",
    obligacion: "Nómina Electrónica",
    vence: "25/06/2026",
    dias: 22,
    estado: "verde",
  },
  {
    id: 8,
    empresa: "CONSTRUCTORA CIMA SAS",
    obligacion: "Retención CREE",
    vence: "08/06/2026",
    dias: 5,
    estado: "naranja",
  },
];

const empresasRecientes = [
  { id: 1, nombre: "INMOBILIARIA DEL PACÍFICO SAS", nit: "901876543-2", estado: "ACTIVA", ciudad: "Cali" },
  { id: 2, nombre: "CONSULTORES DIGITALES LTDA", nit: "900456789-0", estado: "ACTIVA", ciudad: "Bogotá" },
  { id: 3, nombre: "SERVILOGÍSTICA EXPRESS SAS", nit: "890234567-1", estado: "INACTIVA", ciudad: "Barranquilla" },
];

const actividadReciente = [
  {
    id: 1,
    texto: "Declaración IVA radicada — X TOURS SAS",
    tiempo: "hace 23 min",
    tipo: "success",
  },
  {
    id: 2,
    texto: "Nueva empresa registrada — INMOBILIARIA DEL PACÍFICO",
    tiempo: "hace 1 h",
    tipo: "info",
  },
  {
    id: 3,
    texto: "Obligación vencida — INVERSIONES CASTILLO (Renta)",
    tiempo: "hace 3 h",
    tipo: "error",
  },
  {
    id: 4,
    texto: "Nómina reportada — DIAZAR LTDA (mayo 2026)",
    tiempo: "hace 5 h",
    tipo: "success",
  },
  {
    id: 5,
    texto: "Recordatorio enviado — 300 HILOS SAS (ICA vence pronto)",
    tiempo: "ayer 4:10 pm",
    tipo: "warning",
  },
];

const complianceData = [
  { empresa: "X TOURS", cumplimiento: 92 },
  { empresa: "DIAZAR", cumplimiento: 85 },
  { empresa: "300 HILOS", cumplimiento: 78 },
  { empresa: "TEX. NORTE", cumplimiento: 95 },
  { empresa: "INV. CASTILLO", cumplimiento: 60 },
  { empresa: "COM. TORRES", cumplimiento: 88 },
  { empresa: "LOG. ANDINA", cumplimiento: 100 },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function getDiasBadge(dias: number, estado: string) {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border";
  if (estado === "rojo" || dias <= 3)
    return <span className={`${base} bg-red-100 text-red-800 border-red-200`}>{dias}d</span>;
  if (estado === "naranja" || dias <= 7)
    return <span className={`${base} bg-orange-100 text-orange-800 border-orange-200`}>{dias}d</span>;
  if (estado === "amarillo" || dias <= 14)
    return <span className={`${base} bg-yellow-100 text-yellow-800 border-yellow-200`}>{dias}d</span>;
  return <span className={`${base} bg-green-100 text-green-800 border-green-200`}>{dias}d</span>;
}

function getBarColor(value: number) {
  if (value >= 90) return "#16a34a";
  if (value >= 75) return "#2563eb";
  if (value >= 60) return "#d97706";
  return "#dc2626";
}

function getActivityDot(tipo: string) {
  const map: Record<string, string> = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500",
  };
  return map[tipo] ?? "bg-gray-400";
}

// ── Stat Card ──────────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

function StatCard({ title, value, sub, icon, color, bgColor }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            <p className={`text-sm font-medium ${color}`}>{sub}</p>
          </div>
          <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${bgColor}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Custom Tooltip for chart ───────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
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
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Resumen ejecutivo · Outsoursing Andrés · Junio 2026
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-gray-500 bg-white border border-gray-200 rounded-full px-3 py-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Sincronizado
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Empresas Activas"
          value="24"
          sub="empresas"
          icon={<Building2 className="w-6 h-6 text-green-600" />}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <StatCard
          title="Obligaciones Vencidas"
          value="3"
          sub="requieren atención"
          icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
          color="text-red-600"
          bgColor="bg-red-50"
        />
        <StatCard
          title="Vencen Esta Semana"
          value="8"
          sub="próximas a vencer"
          icon={<Clock className="w-6 h-6 text-orange-600" />}
          color="text-orange-600"
          bgColor="bg-orange-50"
        />
        <StatCard
          title="Pendientes Nómina"
          value="5"
          sub="clientes por reportar"
          icon={<Users className="w-6 h-6 text-blue-600" />}
          color="text-blue-600"
          bgColor="bg-blue-50"
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
                    Ordenadas por fecha de vencimiento
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
                    {obligaciones.map((o) => (
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
                          {o.obligacion}
                        </td>
                        <td className="px-4 py-3.5 text-gray-600 text-xs whitespace-nowrap">
                          {o.vence}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {getDiasBadge(o.dias, o.estado)}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          {o.estado === "rojo" && (
                            <Badge variant="destructive" className="text-xs">Vencida</Badge>
                          )}
                          {o.estado === "naranja" && (
                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
                              Urgente
                            </span>
                          )}
                          {o.estado === "amarillo" && (
                            <Badge variant="warning" className="text-xs">Próxima</Badge>
                          )}
                          {o.estado === "verde" && (
                            <Badge variant="success" className="text-xs">Al día</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
                  <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700 h-7 px-2">
                    Ver todas
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {empresasRecientes.map((e) => (
                <Link key={e.id} href={`/empresas/${e.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 shrink-0">
                      <Building2 className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {e.nombre}
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
              ))}
            </CardContent>
          </Card>

          {/* Actividad reciente */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-0">
                {actividadReciente.map((a, idx) => (
                  <div key={a.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${getActivityDot(a.tipo)}`}
                      />
                      {idx < actividadReciente.length - 1 && (
                        <div className="w-px flex-1 bg-gray-100 my-1" />
                      )}
                    </div>
                    <div className="pb-4 flex-1 min-w-0">
                      <p className="text-xs text-gray-700 leading-snug">
                        {a.texto}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {a.tiempo}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
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
                  % cumplimiento por empresa · periodo actual
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={complianceData}
                  margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
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
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
                  <Bar dataKey="cumplimiento" radius={[4, 4, 0, 0]}>
                    {complianceData.map((entry, index) => (
                      <Cell key={index} fill={getBarColor(entry.cumplimiento)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-5 mt-3 pt-3 border-t border-gray-100">
              {[
                { color: "bg-green-500", label: "≥ 90% Excelente" },
                { color: "bg-blue-500", label: "75-89% Bueno" },
                { color: "bg-amber-500", label: "60-74% Regular" },
                { color: "bg-red-500", label: "< 60% Crítico" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-sm ${l.color}`} />
                  <span className="text-[11px] text-gray-500">{l.label}</span>
                </div>
              ))}
            </div>
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
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  7 tareas completadas hoy
                </span>
                <span>Jun 03</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
