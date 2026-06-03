"use client";

import { useState, useMemo, useRef } from "react";
import {
  Plus,
  Download,
  Search,
  X,
  ChevronDown,
  Pencil,
  Trash2,
  Building2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  CalendarDays,
  List,
  LayoutGrid,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  OBLIGACIONES_MOCK,
  EMPRESAS,
  TIPOS_OBLIGACION,
  ESTADOS_LABELS,
  EstadoObligacion,
  Obligacion,
} from "@/components/calendario/mockData";
import VencimientoBadge from "@/components/calendario/VencimientoBadge";
import CalendarioView from "@/components/calendario/CalendarioView";
import ObligacionFormModal from "@/components/calendario/ObligacionFormModal";

// ── Constants ──────────────────────────────────────────────────────────────────

const TODAY = new Date(2026, 5, 3); // June 3, 2026

const RESPONSABLES_FILTER = [
  "Andrés Torres",
  "María López",
  "Carlos Ramírez",
  "Ana Martínez",
  "Pedro Gómez",
  "Luisa Herrera",
];

const ESTADOS_FILTER: { value: EstadoObligacion | "TODOS"; label: string }[] = [
  { value: "TODOS", label: "Todos los estados" },
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "EN_PROCESO", label: "En Proceso" },
  { value: "PRESENTADO", label: "Presentado" },
  { value: "PAGADO", label: "Pagado" },
  { value: "VENCIDO", label: "Vencido" },
];

const MONTHS = [
  { value: "0", label: "Enero" },
  { value: "1", label: "Febrero" },
  { value: "2", label: "Marzo" },
  { value: "3", label: "Abril" },
  { value: "4", label: "Mayo" },
  { value: "5", label: "Junio" },
  { value: "6", label: "Julio" },
  { value: "7", label: "Agosto" },
  { value: "8", label: "Septiembre" },
  { value: "9", label: "Octubre" },
  { value: "10", label: "Noviembre" },
  { value: "11", label: "Diciembre" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function getDaysUntil(dateStr: string): number {
  const due = new Date(dateStr + "T00:00:00");
  const todayMidnight = new Date(
    TODAY.getFullYear(),
    TODAY.getMonth(),
    TODAY.getDate()
  );
  return Math.round(
    (due.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return format(d, "dd/MM/yyyy");
}

function getMesLabel(mes: number): string {
  return MONTHS[mes - 1]?.label ?? `Mes ${mes}`;
}

// ── Estado Badge ───────────────────────────────────────────────────────────────

const estadoBadgeStyles: Record<EstadoObligacion, string> = {
  PENDIENTE: "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200",
  EN_PROCESO: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200",
  PRESENTADO:
    "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200",
  PAGADO: "bg-green-100 text-green-700 border-green-200 hover:bg-green-200",
  VENCIDO: "bg-red-100 text-red-700 border-red-200 hover:bg-red-200",
};

interface EstadoDropdownProps {
  estado: EstadoObligacion;
  onChange: (estado: EstadoObligacion) => void;
}

function EstadoDropdown({ estado, onChange }: EstadoDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const estados: EstadoObligacion[] = [
    "PENDIENTE",
    "EN_PROCESO",
    "PRESENTADO",
    "PAGADO",
    "VENCIDO",
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
          estadoBadgeStyles[estado]
        )}
      >
        {ESTADOS_LABELS[estado]}
        <ChevronDown className="w-3 h-3 opacity-70" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-40 bg-white border border-gray-200 rounded-xl shadow-xl py-1">
          {estados.map((e) => (
            <button
              key={e}
              onClick={(ev) => {
                ev.stopPropagation();
                onChange(e);
                setOpen(false);
              }}
              className={cn(
                "flex items-center gap-2 w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-gray-50 transition-colors",
                estado === e && "bg-blue-50 text-blue-700"
              )}
            >
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  e === "PENDIENTE" && "bg-gray-400",
                  e === "EN_PROCESO" && "bg-blue-500",
                  e === "PRESENTADO" && "bg-purple-500",
                  e === "PAGADO" && "bg-green-500",
                  e === "VENCIDO" && "bg-red-500"
                )}
              />
              {ESTADOS_LABELS[e]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Stat Pill ──────────────────────────────────────────────────────────────────

interface StatPillProps {
  label: string;
  count: number;
  color: string;
  icon: React.ReactNode;
}

function StatPill({ label, count, color, icon }: StatPillProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
        color
      )}
    >
      {icon}
      <span className="font-bold">{count}</span>
      <span className="font-medium opacity-90">{label}</span>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function CalendarioPage() {
  const [obligaciones, setObligaciones] =
    useState<Obligacion[]>(OBLIGACIONES_MOCK);
  const [search, setSearch] = useState("");
  const [filterEmpresa, setFilterEmpresa] = useState("TODAS");
  const [filterEstado, setFilterEstado] = useState<
    EstadoObligacion | "TODOS"
  >("TODOS");
  const [filterTipo, setFilterTipo] = useState("TODOS");
  const [filterResponsable, setFilterResponsable] = useState("TODOS");
  const [filterMes, setFilterMes] = useState("TODOS");
  const [filterAnio, setFilterAnio] = useState("TODOS");

  const [showModal, setShowModal] = useState(false);
  const [editingObligacion, setEditingObligacion] =
    useState<Obligacion | null>(null);
  const [activeTab, setActiveTab] = useState("lista");

  // Stats
  const stats = useMemo(() => {
    const now = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate());
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const vencidas = obligaciones.filter((o) => o.estado === "VENCIDO").length;
    const estaSemana = obligaciones.filter((o) => {
      if (o.estado === "PAGADO" || o.estado === "PRESENTADO") return false;
      const d = new Date(o.fechaVencimiento + "T00:00:00");
      return d >= now && d <= weekEnd;
    }).length;
    const esteMes = obligaciones.filter((o) => {
      if (o.estado === "PAGADO" || o.estado === "PRESENTADO") return false;
      const d = new Date(o.fechaVencimiento + "T00:00:00");
      return d >= now && d <= monthEnd;
    }).length;
    const completadas = obligaciones.filter(
      (o) => o.estado === "PAGADO" || o.estado === "PRESENTADO"
    ).length;

    return { vencidas, estaSemana, esteMes, completadas };
  }, [obligaciones]);

  // Filtered list
  const filtered = useMemo(() => {
    return obligaciones.filter((o) => {
      if (
        search &&
        !o.empresa.toLowerCase().includes(search.toLowerCase()) &&
        !o.tipoObligacion.toLowerCase().includes(search.toLowerCase()) &&
        !o.responsable.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      if (filterEmpresa !== "TODAS" && o.empresa !== filterEmpresa)
        return false;
      if (filterEstado !== "TODOS" && o.estado !== filterEstado) return false;
      if (filterTipo !== "TODOS" && o.tipoObligacion !== filterTipo)
        return false;
      if (filterResponsable !== "TODOS" && o.responsable !== filterResponsable)
        return false;
      if (filterMes !== "TODOS") {
        const d = new Date(o.fechaVencimiento + "T00:00:00");
        if (d.getMonth() !== Number(filterMes)) return false;
      }
      if (filterAnio !== "TODOS") {
        const d = new Date(o.fechaVencimiento + "T00:00:00");
        if (d.getFullYear() !== Number(filterAnio)) return false;
      }
      return true;
    });
  }, [
    obligaciones,
    search,
    filterEmpresa,
    filterEstado,
    filterTipo,
    filterResponsable,
    filterMes,
    filterAnio,
  ]);

  // Sorted: vencidas first, then by date asc
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const daysA = getDaysUntil(a.fechaVencimiento);
      const daysB = getDaysUntil(b.fechaVencimiento);
      // Vencidas (negative days or VENCIDO) go first
      if (a.estado === "VENCIDO" && b.estado !== "VENCIDO") return -1;
      if (b.estado === "VENCIDO" && a.estado !== "VENCIDO") return 1;
      // Completed go last
      const aCompleted = a.estado === "PAGADO" || a.estado === "PRESENTADO";
      const bCompleted = b.estado === "PAGADO" || b.estado === "PRESENTADO";
      if (aCompleted && !bCompleted) return 1;
      if (!aCompleted && bCompleted) return -1;
      return daysA - daysB;
    });
  }, [filtered]);

  // Grouped by empresa
  const groupedByEmpresa = useMemo(() => {
    const groups: Record<string, Obligacion[]> = {};
    sorted.forEach((o) => {
      if (!groups[o.empresa]) groups[o.empresa] = [];
      groups[o.empresa].push(o);
    });
    return groups;
  }, [sorted]);

  const hasActiveFilters =
    search ||
    filterEmpresa !== "TODAS" ||
    filterEstado !== "TODOS" ||
    filterTipo !== "TODOS" ||
    filterResponsable !== "TODOS" ||
    filterMes !== "TODOS" ||
    filterAnio !== "TODOS";

  function clearFilters() {
    setSearch("");
    setFilterEmpresa("TODAS");
    setFilterEstado("TODOS");
    setFilterTipo("TODOS");
    setFilterResponsable("TODOS");
    setFilterMes("TODOS");
    setFilterAnio("TODOS");
  }

  function handleEstadoChange(id: string, newEstado: EstadoObligacion) {
    setObligaciones((prev) =>
      prev.map((o) => (o.id === id ? { ...o, estado: newEstado } : o))
    );
  }

  function handleContabilizadoChange(id: string, value: boolean) {
    setObligaciones((prev) =>
      prev.map((o) => (o.id === id ? { ...o, contabilizado: value } : o))
    );
  }

  function handleDeclaradoChange(id: string, value: boolean) {
    setObligaciones((prev) =>
      prev.map((o) => (o.id === id ? { ...o, declarado: value } : o))
    );
  }

  function handlePagadoChange(id: string, value: boolean) {
    setObligaciones((prev) =>
      prev.map((o) => (o.id === id ? { ...o, pagado: value } : o))
    );
  }

  function handleSave(obligacion: Obligacion) {
    setObligaciones((prev) => {
      const idx = prev.findIndex((o) => o.id === obligacion.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = obligacion;
        return next;
      }
      return [...prev, obligacion];
    });
  }

  function handleDelete(id: string) {
    if (confirm("¿Eliminar esta obligación?")) {
      setObligaciones((prev) => prev.filter((o) => o.id !== id));
    }
  }

  function handleEdit(obligacion: Obligacion) {
    setEditingObligacion(obligacion);
    setShowModal(true);
  }

  function handleNewObligacion() {
    setEditingObligacion(null);
    setShowModal(true);
  }

  function handleExport() {
    const headers = [
      "Empresa",
      "Tipo Obligación",
      "Municipio",
      "Periodicidad",
      "Período",
      "Año",
      "Fecha Vencimiento",
      "Días",
      "Estado",
      "Contabilizado",
      "Declarado",
      "Pagado",
      "Responsable",
      "Observaciones",
    ];
    const rows = sorted.map((o) => [
      o.empresa,
      o.tipoObligacion,
      o.municipio,
      o.periodicidad,
      getMesLabel(o.periodo),
      o.anio,
      formatDate(o.fechaVencimiento),
      getDaysUntil(o.fechaVencimiento),
      ESTADOS_LABELS[o.estado],
      o.contabilizado ? "Sí" : "No",
      o.declarado ? "Sí" : "No",
      o.pagado ? "Sí" : "No",
      o.responsable,
      o.observaciones || "",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${v}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `calendario-tributario-${format(TODAY, "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const currentMonthYear = format(TODAY, "MMMM yyyy", { locale: es });

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Calendario Tributario
          </h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">
            {currentMonthYear} · {obligaciones.length} obligaciones registradas
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={handleNewObligacion}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm shadow-blue-600/25"
          >
            <Plus className="w-4 h-4" />
            Nueva Obligación
          </Button>
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* ── Stats Pills ── */}
      <div className="flex flex-wrap gap-2">
        <StatPill
          label="Vencidas"
          count={stats.vencidas}
          color="bg-red-50 text-red-700 border-red-200"
          icon={<AlertTriangle className="w-3.5 h-3.5" />}
        />
        <StatPill
          label="Esta Semana"
          count={stats.estaSemana}
          color="bg-orange-50 text-orange-700 border-orange-200"
          icon={<Clock className="w-3.5 h-3.5" />}
        />
        <StatPill
          label="Este Mes"
          count={stats.esteMes}
          color="bg-yellow-50 text-yellow-700 border-yellow-200"
          icon={<CalendarDays className="w-3.5 h-3.5" />}
        />
        <StatPill
          label="Completadas"
          count={stats.completadas}
          color="bg-green-50 text-green-700 border-green-200"
          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
        />
      </div>

      {/* ── Filter Bar ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar empresa, tipo..."
              className="pl-9 text-sm"
            />
          </div>

          {/* Empresa */}
          <Select value={filterEmpresa} onValueChange={setFilterEmpresa}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Empresa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODAS">Todas las empresas</SelectItem>
              {EMPRESAS.map((e) => (
                <SelectItem key={e.nombre} value={e.nombre}>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: e.color }}
                    />
                    {e.nombre}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Estado */}
          <Select
            value={filterEstado}
            onValueChange={(v) =>
              setFilterEstado(v as EstadoObligacion | "TODOS")
            }
          >
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS_FILTER.map((e) => (
                <SelectItem key={e.value} value={e.value}>
                  {e.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Tipo */}
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Tipo obligación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos los tipos</SelectItem>
              {TIPOS_OBLIGACION.filter((t) => t !== "Personalizada").map(
                (t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>

          {/* Responsable */}
          <Select
            value={filterResponsable}
            onValueChange={setFilterResponsable}
          >
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Responsable" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              {RESPONSABLES_FILTER.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Mes */}
          <Select value={filterMes} onValueChange={setFilterMes}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos los meses</SelectItem>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Año */}
          <Select value={filterAnio} onValueChange={setFilterAnio}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos los años</SelectItem>
              {[2024, 2025, 2026, 2027].map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs text-gray-500 hover:text-gray-700 gap-1.5 self-center"
            >
              <X className="w-3.5 h-3.5" />
              Limpiar filtros
            </Button>
          )}
        </div>

        {filtered.length !== obligaciones.length && (
          <p className="text-xs text-gray-400 mt-3">
            Mostrando{" "}
            <span className="font-semibold text-gray-600">{filtered.length}</span>{" "}
            de {obligaciones.length} obligaciones
          </p>
        )}
      </div>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-10">
          <TabsTrigger value="lista" className="gap-2 text-sm px-4">
            <List className="w-4 h-4" />
            Lista
          </TabsTrigger>
          <TabsTrigger value="calendario" className="gap-2 text-sm px-4">
            <CalendarDays className="w-4 h-4" />
            Calendario
          </TabsTrigger>
          <TabsTrigger value="empresa" className="gap-2 text-sm px-4">
            <LayoutGrid className="w-4 h-4" />
            Por Empresa
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Lista ── */}
        <TabsContent value="lista" className="mt-4">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    {[
                      "Empresa",
                      "Tipo Obligación",
                      "Nivel",
                      "Periodicidad",
                      "Período",
                      "Año",
                      "Vencimiento",
                      "Días",
                      "Estado",
                      "Contabilizado",
                      "Declarado",
                      "Pagado",
                      "Responsable",
                      "",
                    ].map((col) => (
                      <th
                        key={col}
                        className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sorted.length === 0 ? (
                    <tr>
                      <td
                        colSpan={14}
                        className="px-4 py-12 text-center text-sm text-gray-400"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <CalendarDays className="w-8 h-8 text-gray-200" />
                          <span>No hay obligaciones que coincidan con los filtros</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sorted.map((o) => {
                      const days = getDaysUntil(o.fechaVencimiento);
                      const isCompleted =
                        o.estado === "PAGADO" || o.estado === "PRESENTADO";
                      return (
                        <tr
                          key={o.id}
                          className={cn(
                            "hover:bg-gray-50/80 transition-colors group",
                            isCompleted && "opacity-70"
                          )}
                        >
                          {/* Empresa */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: o.empresaColor }}
                              />
                              <span className="font-medium text-gray-900 text-xs leading-tight max-w-[130px] truncate">
                                {o.empresa}
                              </span>
                            </div>
                          </td>

                          {/* Tipo */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-gray-700 text-xs font-medium">
                              {o.tipoObligacion}
                            </span>
                          </td>

                          {/* Nivel */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={cn(
                                "text-xs rounded-full px-2 py-0.5 font-medium",
                                o.municipio === "Nacional"
                                  ? "bg-slate-100 text-slate-600"
                                  : "bg-indigo-50 text-indigo-600"
                              )}
                            >
                              {o.municipio}
                            </span>
                          </td>

                          {/* Periodicidad */}
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                            {o.periodicidad}
                          </td>

                          {/* Período */}
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                            {getMesLabel(o.periodo)}
                          </td>

                          {/* Año */}
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                            {o.anio}
                          </td>

                          {/* Fecha */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-xs font-mono text-gray-600">
                              {formatDate(o.fechaVencimiento)}
                            </span>
                          </td>

                          {/* Días badge */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <VencimientoBadge
                              days={days}
                              estado={o.estado}
                              showText={true}
                            />
                          </td>

                          {/* Estado (inline dropdown) */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <EstadoDropdown
                              estado={o.estado}
                              onChange={(newEstado) =>
                                handleEstadoChange(o.id, newEstado)
                              }
                            />
                          </td>

                          {/* Contabilizado */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleContabilizadoChange(o.id, true); }}
                                className={cn(
                                  "px-2.5 py-1 rounded-l-full text-xs font-semibold border transition-colors",
                                  o.contabilizado
                                    ? "bg-green-500 text-white border-green-500"
                                    : "bg-white text-gray-400 border-gray-200 hover:border-green-400 hover:text-green-600"
                                )}
                              >
                                Sí
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleContabilizadoChange(o.id, false); }}
                                className={cn(
                                  "px-2.5 py-1 rounded-r-full text-xs font-semibold border transition-colors",
                                  !o.contabilizado
                                    ? "bg-gray-500 text-white border-gray-500"
                                    : "bg-white text-gray-400 border-gray-200 hover:border-gray-400 hover:text-gray-600"
                                )}
                              >
                                No
                              </button>
                            </div>
                          </td>

                          {/* Declarado */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeclaradoChange(o.id, true); }}
                                className={cn(
                                  "px-2.5 py-1 rounded-l-full text-xs font-semibold border transition-colors",
                                  o.declarado
                                    ? "bg-blue-500 text-white border-blue-500"
                                    : "bg-white text-gray-400 border-gray-200 hover:border-blue-400 hover:text-blue-600"
                                )}
                              >
                                Sí
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeclaradoChange(o.id, false); }}
                                className={cn(
                                  "px-2.5 py-1 rounded-r-full text-xs font-semibold border transition-colors",
                                  !o.declarado
                                    ? "bg-gray-500 text-white border-gray-500"
                                    : "bg-white text-gray-400 border-gray-200 hover:border-gray-400 hover:text-gray-600"
                                )}
                              >
                                No
                              </button>
                            </div>
                          </td>

                          {/* Pagado */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); handlePagadoChange(o.id, true); }}
                                className={cn(
                                  "px-2.5 py-1 rounded-l-full text-xs font-semibold border transition-colors",
                                  o.pagado
                                    ? "bg-purple-500 text-white border-purple-500"
                                    : "bg-white text-gray-400 border-gray-200 hover:border-purple-400 hover:text-purple-600"
                                )}
                              >
                                Sí
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handlePagadoChange(o.id, false); }}
                                className={cn(
                                  "px-2.5 py-1 rounded-r-full text-xs font-semibold border transition-colors",
                                  !o.pagado
                                    ? "bg-gray-500 text-white border-gray-500"
                                    : "bg-white text-gray-400 border-gray-200 hover:border-gray-400 hover:text-gray-600"
                                )}
                              >
                                No
                              </button>
                            </div>
                          </td>

                          {/* Responsable */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-xs text-gray-500 max-w-[110px] truncate block">
                              {o.responsable}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEdit(o)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Editar"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(o.id)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Quick add row */}
            <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/30">
              <button
                onClick={handleNewObligacion}
                className="flex items-center gap-2 text-xs text-gray-400 hover:text-blue-600 transition-colors group"
              >
                <div className="w-6 h-6 rounded-full border-2 border-dashed border-gray-300 group-hover:border-blue-400 flex items-center justify-center transition-colors">
                  <Plus className="w-3 h-3" />
                </div>
                Agregar nueva obligación...
              </button>
            </div>
          </div>
        </TabsContent>

        {/* ── Tab: Calendario ── */}
        <TabsContent value="calendario" className="mt-4">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
            <CalendarioView obligaciones={filtered} />
          </div>
        </TabsContent>

        {/* ── Tab: Por Empresa ── */}
        <TabsContent value="empresa" className="mt-4">
          <div className="space-y-4">
            {Object.keys(groupedByEmpresa).length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                <Building2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">
                  No hay obligaciones que coincidan con los filtros
                </p>
              </div>
            ) : (
              Object.entries(groupedByEmpresa).map(
                ([empresa, empresaObligaciones]) => {
                  const empresaInfo = EMPRESAS.find(
                    (e) => e.nombre === empresa
                  );
                  const vencidas = empresaObligaciones.filter(
                    (o) => o.estado === "VENCIDO"
                  ).length;
                  const completadas = empresaObligaciones.filter(
                    (o) =>
                      o.estado === "PAGADO" || o.estado === "PRESENTADO"
                  ).length;
                  const pendientes = empresaObligaciones.filter(
                    (o) =>
                      o.estado === "PENDIENTE" || o.estado === "EN_PROCESO"
                  ).length;

                  return (
                    <div
                      key={empresa}
                      className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
                    >
                      {/* Company header */}
                      <div
                        className="flex items-center justify-between px-5 py-4 border-b border-gray-100"
                        style={{
                          borderLeftColor: empresaInfo?.color,
                          borderLeftWidth: "4px",
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center"
                            style={{
                              backgroundColor: empresaInfo?.color + "20",
                            }}
                          >
                            <Building2
                              className="w-4 h-4"
                              style={{ color: empresaInfo?.color }}
                            />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-gray-900">
                              {empresa}
                            </h3>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {empresaObligaciones.length} obligaciones
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {vencidas > 0 && (
                            <span className="text-xs font-semibold bg-red-100 text-red-700 border border-red-200 rounded-full px-2.5 py-1">
                              {vencidas} vencida{vencidas > 1 ? "s" : ""}
                            </span>
                          )}
                          {pendientes > 0 && (
                            <span className="text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200 rounded-full px-2.5 py-1">
                              {pendientes} pendiente{pendientes > 1 ? "s" : ""}
                            </span>
                          )}
                          {completadas > 0 && (
                            <span className="text-xs font-semibold bg-green-100 text-green-700 border border-green-200 rounded-full px-2.5 py-1">
                              {completadas} completada{completadas > 1 ? "s" : ""}
                            </span>
                          )}
                          <button
                            onClick={() => {
                              setEditingObligacion(null);
                              setShowModal(true);
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Agregar obligación a esta empresa"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Obligations table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-gray-50/50">
                              {[
                                "Tipo Obligación",
                                "Nivel",
                                "Periodicidad",
                                "Período / Año",
                                "Vencimiento",
                                "Días",
                                "Estado",
                                "Contabilizado",
                                "Declarado",
                                "Pagado",
                                "Responsable",
                                "",
                              ].map((col) => (
                                <th
                                  key={col}
                                  className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap"
                                >
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {empresaObligaciones.map((o) => {
                              const days = getDaysUntil(o.fechaVencimiento);
                              const isCompleted =
                                o.estado === "PAGADO" ||
                                o.estado === "PRESENTADO";
                              return (
                                <tr
                                  key={o.id}
                                  className={cn(
                                    "hover:bg-gray-50/60 transition-colors group",
                                    isCompleted && "opacity-60"
                                  )}
                                >
                                  <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-800">
                                    {o.tipoObligacion}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span
                                      className={cn(
                                        "rounded-full px-2 py-0.5 font-medium",
                                        o.municipio === "Nacional"
                                          ? "bg-slate-100 text-slate-600"
                                          : "bg-indigo-50 text-indigo-600"
                                      )}
                                    >
                                      {o.municipio}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                                    {o.periodicidad}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                                    {getMesLabel(o.periodo)} {o.anio}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap font-mono text-gray-600">
                                    {formatDate(o.fechaVencimiento)}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <VencimientoBadge
                                      days={days}
                                      estado={o.estado}
                                      showText={true}
                                    />
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <EstadoDropdown
                                      estado={o.estado}
                                      onChange={(newEstado) =>
                                        handleEstadoChange(o.id, newEstado)
                                      }
                                    />
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex gap-1">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleContabilizadoChange(o.id, true); }}
                                        className={cn(
                                          "px-2 py-0.5 rounded-l-full text-xs font-semibold border transition-colors",
                                          o.contabilizado
                                            ? "bg-green-500 text-white border-green-500"
                                            : "bg-white text-gray-400 border-gray-200 hover:border-green-400 hover:text-green-600"
                                        )}
                                      >
                                        Sí
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleContabilizadoChange(o.id, false); }}
                                        className={cn(
                                          "px-2 py-0.5 rounded-r-full text-xs font-semibold border transition-colors",
                                          !o.contabilizado
                                            ? "bg-gray-500 text-white border-gray-500"
                                            : "bg-white text-gray-400 border-gray-200 hover:border-gray-400 hover:text-gray-600"
                                        )}
                                      >
                                        No
                                      </button>
                                    </div>
                                  </td>
                                  {/* Declarado */}
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex gap-1">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleDeclaradoChange(o.id, true); }}
                                        className={cn(
                                          "px-2 py-0.5 rounded-l-full text-xs font-semibold border transition-colors",
                                          o.declarado
                                            ? "bg-blue-500 text-white border-blue-500"
                                            : "bg-white text-gray-400 border-gray-200 hover:border-blue-400 hover:text-blue-600"
                                        )}
                                      >
                                        Sí
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleDeclaradoChange(o.id, false); }}
                                        className={cn(
                                          "px-2 py-0.5 rounded-r-full text-xs font-semibold border transition-colors",
                                          !o.declarado
                                            ? "bg-gray-500 text-white border-gray-500"
                                            : "bg-white text-gray-400 border-gray-200 hover:border-gray-400 hover:text-gray-600"
                                        )}
                                      >
                                        No
                                      </button>
                                    </div>
                                  </td>
                                  {/* Pagado */}
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex gap-1">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handlePagadoChange(o.id, true); }}
                                        className={cn(
                                          "px-2 py-0.5 rounded-l-full text-xs font-semibold border transition-colors",
                                          o.pagado
                                            ? "bg-purple-500 text-white border-purple-500"
                                            : "bg-white text-gray-400 border-gray-200 hover:border-purple-400 hover:text-purple-600"
                                        )}
                                      >
                                        Sí
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handlePagadoChange(o.id, false); }}
                                        className={cn(
                                          "px-2 py-0.5 rounded-r-full text-xs font-semibold border transition-colors",
                                          !o.pagado
                                            ? "bg-gray-500 text-white border-gray-500"
                                            : "bg-white text-gray-400 border-gray-200 hover:border-gray-400 hover:text-gray-600"
                                        )}
                                      >
                                        No
                                      </button>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-gray-500 max-w-[120px] truncate">
                                    {o.responsable}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => handleEdit(o)}
                                        className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                      >
                                        <Pencil className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(o.id)}
                                        className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                }
              )
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Modal ── */}
      <ObligacionFormModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingObligacion(null);
        }}
        onSave={handleSave}
        editingObligacion={editingObligacion}
      />
    </div>
  );
}
