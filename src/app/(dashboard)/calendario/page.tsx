"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  Plus, Download, Search, X, ChevronDown, Pencil, Trash2,
  Building2, AlertTriangle, Clock, CheckCircle2, CalendarDays,
  List, LayoutGrid, Paperclip, History, Copy,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  TIPOS_OBLIGACION, ESTADOS_LABELS, EstadoObligacion, Obligacion,
} from "@/components/calendario/mockData";
import { useAppSession } from "@/hooks/useAppSession";
import VencimientoBadge from "@/components/calendario/VencimientoBadge";
import CalendarioView from "@/components/calendario/CalendarioView";
import ObligacionFormModal from "@/components/calendario/ObligacionFormModal";
import UploadDocumentoModal, { DocumentoInfo } from "@/components/calendario/UploadDocumentoModal";

// ── Constants ──────────────────────────────────────────────────────────────────

const TODAY = new Date();

const MONTHS = [
  { value: "0", label: "Enero" }, { value: "1", label: "Febrero" },
  { value: "2", label: "Marzo" }, { value: "3", label: "Abril" },
  { value: "4", label: "Mayo" }, { value: "5", label: "Junio" },
  { value: "6", label: "Julio" }, { value: "7", label: "Agosto" },
  { value: "8", label: "Septiembre" }, { value: "9", label: "Octubre" },
  { value: "10", label: "Noviembre" }, { value: "11", label: "Diciembre" },
];

const EMPRESA_COLORS = [
  "#3B82F6","#8B5CF6","#EC4899","#F59E0B","#10B981",
  "#EF4444","#6366F1","#14B8A6","#F97316","#84CC16",
];

const PERIODICIDAD_LABEL: Record<string, string> = {
  QUINCENAL: "Quincenal", MENSUAL: "Mensual", BIMESTRAL: "Bimestral",
  TRIMESTRAL: "Trimestral", CUATRIMESTRAL: "Cuatrimestral",
  SEMESTRAL: "Semestral", ANUAL: "Anual", UNICA: "Única",
};

const PERIODICIDAD_ENUM: Record<string, string> = {
  Quincenal: "QUINCENAL", Mensual: "MENSUAL", Bimestral: "BIMESTRAL",
  Trimestral: "TRIMESTRAL", Cuatrimestral: "CUATRIMESTRAL",
  Semestral: "SEMESTRAL", Anual: "ANUAL",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function empresaColor(id: string): string {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return EMPRESA_COLORS[Math.abs(h) % EMPRESA_COLORS.length];
}

function getDaysUntil(dateStr: string): number {
  const due = new Date(dateStr + (dateStr.includes("T") ? "" : "T00:00:00"));
  const now = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate());
  return Math.round((due.getTime() - now.getTime()) / 86400000);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr.includes("T") ? dateStr : dateStr + "T00:00:00");
  return format(d, "dd/MM/yyyy");
}

function getMesLabel(mes: number): string {
  return MONTHS[mes - 1]?.label ?? `Mes ${mes}`;
}

const QUINCENA_LABELS: string[] = (() => {
  const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
                 "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  return meses.flatMap((m) => [`1ª quincena de ${m}`, `2ª quincena de ${m}`]);
})();

function getPeriodoLabel(periodo: number, periodicidad: string): string {
  switch (periodicidad) {
    case "Quincenal":
      return QUINCENA_LABELS[periodo - 1] ?? `Quincena ${periodo}`;
    case "Bimestral": {
      const m: Record<number, string> = {
        1: "Enero – Febrero", 3: "Marzo – Abril", 5: "Mayo – Junio",
        7: "Julio – Agosto", 9: "Septiembre – Octubre", 11: "Noviembre – Diciembre",
      };
      return m[periodo] ?? getMesLabel(periodo);
    }
    case "Trimestral": {
      const m: Record<number, string> = {
        1: "Enero – Marzo", 4: "Abril – Junio",
        7: "Julio – Septiembre", 10: "Octubre – Diciembre",
      };
      return m[periodo] ?? getMesLabel(periodo);
    }
    case "Cuatrimestral": {
      const m: Record<number, string> = {
        1: "Enero – Abril", 5: "Mayo – Agosto", 9: "Septiembre – Diciembre",
      };
      return m[periodo] ?? getMesLabel(periodo);
    }
    case "Semestral": {
      const m: Record<number, string> = {
        1: "Enero – Junio", 7: "Julio – Diciembre",
      };
      return m[periodo] ?? getMesLabel(periodo);
    }
    case "Anual":
      return "Año completo";
    default:
      return getMesLabel(periodo);
  }
}

function isoDate(str: string): string {
  return str.includes("T") ? str.split("T")[0] : str;
}

function mapDB(row: any): Obligacion {
  const fv = row.fechaVencimiento ?? "";
  return {
    id: row.id,
    empresa: row.empresa?.razonSocial ?? "",
    empresaId: row.empresaId,
    empresaColor: empresaColor(row.empresaId ?? "x"),
    tipoObligacion: row.tipoObligacion,
    municipio: row.municipio ?? "Nacional",
    periodicidad: (PERIODICIDAD_LABEL[row.periodicidad] ?? row.periodicidad ?? "Mensual") as any,
    periodo: row.periodo ? Number(row.periodo) : 1,
    anio: row.año,
    fechaVencimiento: isoDate(fv),
    estado: (row.estado ?? "PENDIENTE") as EstadoObligacion,
    responsable: row.responsableNombre ?? row.responsable?.name ?? "Sin asignar",
    observaciones: row.observaciones ?? undefined,
    contabilizado: !!row.contabilizado,
    contabilizadoArchivoNombre: row.contabilizadoArchivoNombre ?? null,
    contabilizadoFecha: row.contabilizadoFecha ? isoDate(String(row.contabilizadoFecha)) : null,
    contabilizadoPorNombre: row.contabilizadoPor?.name ?? null,
    declarado: !!row.declarado,
    declaradoArchivoNombre: row.declaradoArchivoNombre ?? null,
    declaradoFecha: row.declaradoFecha ? isoDate(String(row.declaradoFecha)) : null,
    declaradoPorNombre: row.declaradoPor?.name ?? null,
    pagado: !!row.pagado,
  };
}

// ── Estado Badge ───────────────────────────────────────────────────────────────

const estadoBadgeStyles: Record<EstadoObligacion, string> = {
  PENDIENTE: "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200",
  EN_PROCESO: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200",
  PRESENTADO: "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200",
  PAGADO: "bg-green-100 text-green-700 border-green-200 hover:bg-green-200",
  VENCIDO: "bg-red-100 text-red-700 border-red-200 hover:bg-red-200",
};

function EstadoDropdown({ estado, onChange }: { estado: EstadoObligacion; onChange: (e: EstadoObligacion) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const estados: EstadoObligacion[] = ["PENDIENTE", "EN_PROCESO", "PRESENTADO", "PAGADO", "VENCIDO"];

  useEffect(() => {
    function onClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors", estadoBadgeStyles[estado])}
      >
        {ESTADOS_LABELS[estado]}
        <ChevronDown className="w-3 h-3 opacity-70" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-40 bg-white border border-gray-200 rounded-xl shadow-xl py-1">
          {estados.map((e) => (
            <button key={e} onClick={(ev) => { ev.stopPropagation(); onChange(e); setOpen(false); }}
              className={cn("flex items-center gap-2 w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-gray-50 transition-colors", estado === e && "bg-blue-50 text-blue-700")}
            >
              <span className={cn("w-2 h-2 rounded-full", e === "PENDIENTE" && "bg-gray-400", e === "EN_PROCESO" && "bg-blue-500", e === "PRESENTADO" && "bg-purple-500", e === "PAGADO" && "bg-green-500", e === "VENCIDO" && "bg-red-500")} />
              {ESTADOS_LABELS[e]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatPill({ label, count, color, icon }: { label: string; count: number; color: string; icon: React.ReactNode }) {
  return (
    <div className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold", color)}>
      {icon}
      <span className="font-bold">{count}</span>
      <span className="font-medium opacity-90">{label}</span>
    </div>
  );
}

// ── Document cell ──────────────────────────────────────────────────────────────

function DocCell({
  marcado,
  archivoNombre,
  fecha,
  porNombre,
  color,
  label,
  onMark,
  onDownload,
}: {
  marcado: boolean;
  archivoNombre?: string | null;
  fecha?: string | null;
  porNombre?: string | null;
  color: "green" | "blue";
  label: string;
  onMark: () => void;
  onDownload: () => void;
}) {
  const green = color === "green";
  if (marcado && archivoNombre) {
    return (
      <div className="flex items-center gap-1 group/doc">
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold border",
          green ? "bg-green-100 text-green-700 border-green-200" : "bg-blue-100 text-blue-700 border-blue-200"
        )}>
          <Paperclip className="w-3 h-3" />
          {label}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onDownload(); }}
          title={`Descargar: ${archivoNombre}${fecha ? ` · ${fecha}` : ""}${porNombre ? ` · ${porNombre}` : ""}`}
          className={cn("w-6 h-6 flex items-center justify-center rounded-lg transition-colors",
            green ? "text-green-600 bg-green-50 hover:bg-green-100" : "text-blue-600 bg-blue-50 hover:bg-blue-100"
          )}
        >
          <Download className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onMark(); }}
          title="Reemplazar o quitar"
          className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 bg-slate-50 hover:bg-slate-100 hover:text-slate-600 transition-colors opacity-0 group-hover/doc:opacity-100"
        >
          <Pencil className="w-3 h-3" />
        </button>
      </div>
    );
  }
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onMark(); }}
      className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-2.5 py-0.5 text-xs text-slate-400 hover:border-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
    >
      <Paperclip className="w-3 h-3" />
      Adjuntar
    </button>
  );
}

// ── Audit Modal ────────────────────────────────────────────────────────────────

const ACCION_LABELS: Record<string, string> = {
  CONTABILIZADO: "Contabilizado — archivo adjunto",
  CONTABILIZADO_REMOVIDO: "Contabilizado removido",
  DECLARADO: "Declarado — archivo adjunto",
  DECLARADO_REMOVIDO: "Declarado removido",
};

function AuditoriaModal({ obligacionId, open, onClose }: { obligacionId: string; open: boolean; onClose: () => void }) {
  const [auds, setAuds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !obligacionId) return;
    setLoading(true);
    fetch(`/api/obligaciones/${obligacionId}/auditorias`)
      .then(r => r.json())
      .then(d => setAuds(d.auditorias ?? []))
      .catch(() => setAuds([]))
      .finally(() => setLoading(false));
  }, [obligacionId, open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-500" />
            Historial de Auditoría
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-2 mt-2">
          {loading && <p className="text-sm text-center text-slate-400 py-6">Cargando...</p>}
          {!loading && auds.length === 0 && (
            <p className="text-sm text-center text-slate-400 py-6">Sin registros de auditoría</p>
          )}
          {auds.map((a) => (
            <div key={a.id} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700">
                  {ACCION_LABELS[a.accion] ?? a.accion}
                </span>
                <span className="text-xs text-slate-400 shrink-0">
                  {a.fechaAccion ? format(new Date(a.fechaAccion), "dd/MM/yyyy HH:mm") : ""}
                </span>
              </div>
              {a.archivoNombre && (
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Paperclip className="w-3 h-3" />
                  {a.archivoNombre}
                </p>
              )}
              {a.realizadoPor?.name && (
                <p className="text-xs text-slate-500">Por: <strong>{a.realizadoPor.name}</strong></p>
              )}
              {a.detalles && <p className="text-xs text-slate-400">{a.detalles}</p>}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function CalendarioPage() {
  const [obligaciones, setObligaciones] = useState<Obligacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { appSession: session } = useAppSession();
  const [empresasData, setEmpresasData] = useState<{ id: string; razonSocial: string; nit: string; estado: string }[]>([]);

  // Load empresas + obligaciones
  useEffect(() => {
    async function load() {
      const [empRes, oblRes] = await Promise.allSettled([
        fetch("/api/empresas?limit=500"),
        fetch("/api/obligaciones?limit=500"),
      ]);

      if (empRes.status === "fulfilled" && empRes.value.ok) {
        const d = await empRes.value.json();
        setEmpresasData(Array.isArray(d.empresas) ? d.empresas : Array.isArray(d) ? d : []);
      }

      if (oblRes.status === "fulfilled" && oblRes.value.ok) {
        const d = await oblRes.value.json();
        const rows: any[] = Array.isArray(d.obligaciones) ? d.obligaciones : [];
        setObligaciones(rows.map(mapDB));
      }

      setLoading(false);
    }
    load();
  }, []);

  // Empresa options for the form modal
  const empresasOptions = useMemo(() =>
    empresasData
      .filter(e => e.estado === "ACTIVA" || e.estado === undefined)
      .map(e => ({ id: e.id, nombre: e.razonSocial, color: empresaColor(e.id) })),
    [empresasData]
  );

  // Role-based empresa filter
  const empresasPermitidas: Set<string> | null = useMemo(() => {
    if (!session || session.role === "admin") return null;
    const ids = new Set(session.empresaIds?.map(String) ?? []);
    if (ids.size === 0) return null;
    return new Set(
      empresasData.filter(e => ids.has(String(e.id))).map(e => e.razonSocial)
    );
  }, [session, empresasData]);

  // ── Filter state ─────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterEmpresa, setFilterEmpresa] = useState<string[]>([]);
  const [filterTipo, setFilterTipo] = useState<string[]>([]);
  const [filterMes, setFilterMes] = useState<string[]>([]);
  const [filterAnio, setFilterAnio] = useState<string[]>([]);
  const [filterFechaDesde, setFilterFechaDesde] = useState("");
  const [filterFechaHasta, setFilterFechaHasta] = useState("");

  // ── Modal state ──────────────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [editingObligacion, setEditingObligacion] = useState<Obligacion | null>(null);
  const [activeTab, setActiveTab] = useState("lista");
  const [listaSubTab, setListaSubTab] = useState<"pendientes" | "hechas">("pendientes");

  const [uploadModal, setUploadModal] = useState<{
    tipo: "contabilizado" | "declarado";
    obligacion: Obligacion;
  } | null>(null);

  const [auditModal, setAuditModal] = useState<string | null>(null); // obligacionId

  // ── Downloads ─────────────────────────────────────────────────────────────────
  async function downloadArchivo(id: string, tipo: "contabilizado" | "declarado", nombre: string) {
    const res = await fetch(`/api/obligaciones/${id}/archivo/${tipo}`);
    if (!res.ok) { alert("No se pudo descargar el archivo"); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = nombre; a.click();
    URL.revokeObjectURL(url);
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────────
  async function handleSave(obligacion: Obligacion) {
    setSaving(true);
    try {
      const empresaEncontrada = empresasData.find(e => e.razonSocial === obligacion.empresa);
      const payload = {
        empresaId: obligacion.empresaId ?? empresaEncontrada?.id,
        tipoObligacion: obligacion.tipoObligacion,
        periodicidad: PERIODICIDAD_ENUM[obligacion.periodicidad] ?? "MENSUAL",
        periodo: String(obligacion.periodo),
        año: obligacion.anio,
        fechaVencimiento: obligacion.fechaVencimiento,
        municipio: obligacion.municipio,
        observaciones: obligacion.observaciones ?? null,
        responsableNombre: obligacion.responsable,
        estado: obligacion.estado,
      };

      const isNew = !obligaciones.find(o => o.id === obligacion.id);
      let res: Response;
      if (isNew) {
        res = await fetch("/api/obligaciones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/obligaciones/${obligacion.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) { alert("Error al guardar la obligación"); return; }
      const data = await res.json();
      const mapped = mapDB(data);

      if (isNew) {
        setObligaciones(prev => [...prev, mapped]);
      } else {
        setObligaciones(prev => prev.map(o => o.id === obligacion.id ? mapped : o));
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleEstadoChange(id: string, newEstado: EstadoObligacion) {
    setObligaciones(prev => prev.map(o => o.id === id ? { ...o, estado: newEstado } : o));
    await fetch(`/api/obligaciones/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: newEstado }),
    }).catch(() => {});
  }

  async function handlePagadoChange(id: string, value: boolean) {
    setObligaciones(prev => prev.map(o => o.id === id ? { ...o, pagado: value } : o));
    await fetch(`/api/obligaciones/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pagado: value }),
    }).catch(() => {});
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta obligación? Esta acción no se puede deshacer.")) return;
    await fetch(`/api/obligaciones/${id}`, { method: "DELETE" });
    setObligaciones(prev => prev.filter(o => o.id !== id));
  }

  function handleDuplicate(o: Obligacion) {
    const copy: Obligacion = {
      ...o,
      id: `dup-${Date.now()}`,
      estado: "PENDIENTE",
      contabilizado: false,
      contabilizadoArchivoNombre: null,
      contabilizadoFecha: null,
      contabilizadoPorNombre: null,
      declarado: false,
      declaradoArchivoNombre: null,
      declaradoFecha: null,
      declaradoPorNombre: null,
      pagado: false,
    };
    setEditingObligacion(copy);
    setShowForm(true);
  }

  function handleUploadSuccess(tipo: "contabilizado" | "declarado", info: DocumentoInfo) {
    if (!uploadModal) return;
    const id = uploadModal.obligacion.id;
    setObligaciones(prev => prev.map(o => {
      if (o.id !== id) return o;
      if (tipo === "contabilizado") {
        return {
          ...o,
          contabilizado: !!info.archivoNombre,
          contabilizadoArchivoNombre: info.archivoNombre,
          contabilizadoFecha: info.fecha,
          contabilizadoPorNombre: info.porNombre,
        };
      } else {
        return {
          ...o,
          declarado: !!info.archivoNombre,
          declaradoArchivoNombre: info.archivoNombre,
          declaradoFecha: info.fecha,
          declaradoPorNombre: info.porNombre,
        };
      }
    }));
  }

  // ── Stats ─────────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const now = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate());
    const weekEnd = new Date(now); weekEnd.setDate(weekEnd.getDate() + 7);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const visible = obligaciones.filter(o =>
      !empresasPermitidas || empresasPermitidas.has(o.empresa)
    );

    return {
      vencidas: visible.filter(o => o.estado === "VENCIDO").length,
      estaSemana: visible.filter(o => {
        if (o.estado === "PAGADO" || o.estado === "PRESENTADO") return false;
        const d = new Date(o.fechaVencimiento + (o.fechaVencimiento.includes("T") ? "" : "T00:00:00"));
        return d >= now && d <= weekEnd;
      }).length,
      esteMes: visible.filter(o => {
        if (o.estado === "PAGADO" || o.estado === "PRESENTADO") return false;
        const d = new Date(o.fechaVencimiento + (o.fechaVencimiento.includes("T") ? "" : "T00:00:00"));
        return d >= now && d <= monthEnd;
      }).length,
      completadas: visible.filter(o => o.estado === "PAGADO" || o.estado === "PRESENTADO").length,
    };
  }, [obligaciones, empresasPermitidas]);

  // ── Filtered list ─────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return obligaciones.filter(o => {
      if (empresasPermitidas && !empresasPermitidas.has(o.empresa)) return false;
      if (search && !o.empresa.toLowerCase().includes(search.toLowerCase()) &&
          !o.tipoObligacion.toLowerCase().includes(search.toLowerCase()) &&
          !o.responsable.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterEmpresa.length > 0 && !filterEmpresa.includes(o.empresa)) return false;
      if (filterTipo.length > 0 && !filterTipo.includes(o.tipoObligacion)) return false;
      if (filterMes.length > 0) {
        const d = new Date(o.fechaVencimiento + (o.fechaVencimiento.includes("T") ? "" : "T00:00:00"));
        if (!filterMes.includes(String(d.getMonth()))) return false;
      }
      if (filterAnio.length > 0) {
        const d = new Date(o.fechaVencimiento + (o.fechaVencimiento.includes("T") ? "" : "T00:00:00"));
        if (!filterAnio.includes(String(d.getFullYear()))) return false;
      }
      if (filterFechaDesde && o.fechaVencimiento < filterFechaDesde) return false;
      if (filterFechaHasta && o.fechaVencimiento > filterFechaHasta) return false;
      return true;
    });
  }, [obligaciones, empresasPermitidas, search, filterEmpresa, filterTipo, filterMes, filterAnio, filterFechaDesde, filterFechaHasta]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    if (a.estado === "VENCIDO" && b.estado !== "VENCIDO") return -1;
    if (b.estado === "VENCIDO" && a.estado !== "VENCIDO") return 1;
    const aC = a.estado === "PAGADO" || a.estado === "PRESENTADO";
    const bC = b.estado === "PAGADO" || b.estado === "PRESENTADO";
    if (aC && !bC) return 1;
    if (!aC && bC) return -1;
    return getDaysUntil(a.fechaVencimiento) - getDaysUntil(b.fechaVencimiento);
  }), [filtered]);

  const groupedByEmpresa = useMemo(() => {
    const groups: Record<string, Obligacion[]> = {};
    sorted.forEach(o => { if (!groups[o.empresa]) groups[o.empresa] = []; groups[o.empresa].push(o); });
    return groups;
  }, [sorted]);

  const uniqueEmpresas = useMemo(() =>
    [...new Set(obligaciones.map(o => o.empresa))].filter(Boolean).sort(),
    [obligaciones]
  );

  const hasActiveFilters = search || filterEmpresa.length > 0 || filterTipo.length > 0 ||
    filterMes.length > 0 || filterAnio.length > 0 || filterFechaDesde || filterFechaHasta;

  function clearFilters() {
    setSearch(""); setFilterEmpresa([]); setFilterTipo([]);
    setFilterMes([]); setFilterAnio([]); setFilterFechaDesde(""); setFilterFechaHasta("");
  }

  function handleExport() {
    const headers = ["Empresa","Tipo Obligación","Municipio","Periodicidad","Período","Año","Fecha Vencimiento","Días","Estado","Contabilizado","Doc. Contabilización","Declarado","Doc. Declaración","Pagado","Responsable","Observaciones"];
    const rows = sorted.map(o => [
      o.empresa, o.tipoObligacion, o.municipio, o.periodicidad,
      getPeriodoLabel(o.periodo, o.periodicidad), o.anio, formatDate(o.fechaVencimiento),
      getDaysUntil(o.fechaVencimiento), ESTADOS_LABELS[o.estado],
      o.contabilizado ? "Sí" : "No", o.contabilizadoArchivoNombre ?? "",
      o.declarado ? "Sí" : "No", o.declaradoArchivoNombre ?? "",
      o.pagado ? "Sí" : "No", o.responsable, o.observaciones ?? "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `calendario-${format(TODAY, "yyyy-MM-dd")}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  // ── Row renderer helpers ──────────────────────────────────────────────────────

  function renderDocCell(o: Obligacion, tipo: "contabilizado" | "declarado", size: "sm" | "xs" = "sm") {
    const isCont = tipo === "contabilizado";
    const marcado = isCont ? o.contabilizado : o.declarado;
    const nombre = isCont ? o.contabilizadoArchivoNombre : o.declaradoArchivoNombre;
    const fecha = isCont ? o.contabilizadoFecha : o.declaradoFecha;
    const por = isCont ? o.contabilizadoPorNombre : o.declaradoPorNombre;
    return (
      <DocCell
        key={tipo}
        marcado={marcado}
        archivoNombre={nombre}
        fecha={fecha}
        porNombre={por}
        color={isCont ? "green" : "blue"}
        label={isCont ? "Contabilizado" : "Declarado"}
        onMark={() => setUploadModal({ tipo, obligacion: o })}
        onDownload={() => nombre && downloadArchivo(o.id, tipo, nombre)}
      />
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  const currentMonthYear = format(TODAY, "MMMM yyyy", { locale: es });

  return (
    <div className="flex flex-col h-full gap-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendario Tributario</h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">
            {currentMonthYear} · {obligaciones.length} obligaciones registradas
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => { setEditingObligacion(null); setShowForm(true); }}
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

      {/* Stats */}
      <div className="flex flex-wrap gap-2">
        <StatPill label="Vencidas" count={stats.vencidas} color="bg-red-50 text-red-700 border-red-200" icon={<AlertTriangle className="w-3.5 h-3.5" />} />
        <StatPill label="Esta Semana" count={stats.estaSemana} color="bg-orange-50 text-orange-700 border-orange-200" icon={<Clock className="w-3.5 h-3.5" />} />
        <StatPill label="Este Mes" count={stats.esteMes} color="bg-yellow-50 text-yellow-700 border-yellow-200" icon={<CalendarDays className="w-3.5 h-3.5" />} />
        <StatPill label="Completadas" count={stats.completadas} color="bg-green-50 text-green-700 border-green-200" icon={<CheckCircle2 className="w-3.5 h-3.5" />} />
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Buscar</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Empresa, tipo..." className="pl-9 text-sm" />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Empresa</p>
            <MultiSelect
              values={filterEmpresa}
              onValuesChange={setFilterEmpresa}
              options={uniqueEmpresas.map(e => ({ value: e, label: e }))}
              allLabel="Todas las empresas"
              searchPlaceholder="Buscar empresa..."
              className="w-full text-sm"
            />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo de Obligación</p>
            <MultiSelect
              values={filterTipo}
              onValuesChange={setFilterTipo}
              options={TIPOS_OBLIGACION.filter(t => t !== "Personalizada").map(t => ({ value: t, label: t }))}
              allLabel="Todos los tipos"
              searchPlaceholder="Buscar tipo..."
              className="w-full text-sm"
            />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mes de Vencimiento</p>
            <MultiSelect
              values={filterMes}
              onValuesChange={setFilterMes}
              options={MONTHS.map(m => ({ value: m.value, label: m.label }))}
              allLabel="Todos los meses"
              searchPlaceholder="Buscar mes..."
              className="w-full text-sm"
            />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Año</p>
            <MultiSelect
              values={filterAnio}
              onValuesChange={setFilterAnio}
              options={[2024, 2025, 2026, 2027].map(y => ({ value: String(y), label: String(y) }))}
              allLabel="Todos los años"
              searchPlaceholder="Buscar año..."
              className="w-full text-sm"
            />
          </div>

          <div className="sm:col-span-2 space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Rango de Fechas</p>
            <div className="flex items-center gap-2">
              <Input type="date" value={filterFechaDesde} onChange={(e) => setFilterFechaDesde(e.target.value)} className="text-sm h-9" />
              <span className="text-xs text-gray-400 shrink-0">—</span>
              <Input type="date" value={filterFechaHasta} onChange={(e) => setFilterFechaHasta(e.target.value)} className="text-sm h-9" />
              {(filterFechaDesde || filterFechaHasta) && (
                <button onClick={() => { setFilterFechaDesde(""); setFilterFechaHasta(""); }} className="shrink-0 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-gray-500 hover:text-gray-700 gap-1.5 self-end">
              <X className="w-3.5 h-3.5" />
              Limpiar filtros
            </Button>
          )}
        </div>

        {filtered.length !== obligaciones.length && (
          <p className="text-xs text-gray-400 mt-3">
            Mostrando <span className="font-semibold text-gray-600">{filtered.length}</span> de {obligaciones.length} obligaciones
          </p>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col">
        <TabsList className="h-10">
          <TabsTrigger value="lista" className="gap-2 text-sm px-4"><List className="w-4 h-4" />Lista</TabsTrigger>
          <TabsTrigger value="calendario" className="gap-2 text-sm px-4"><CalendarDays className="w-4 h-4" />Calendario</TabsTrigger>
          <TabsTrigger value="empresa" className="gap-2 text-sm px-4"><LayoutGrid className="w-4 h-4" />Por Empresa</TabsTrigger>
        </TabsList>

        {/* Lista tab */}
        <TabsContent value="lista" className="flex-1 min-h-0 mt-4 data-[state=active]:flex data-[state=active]:flex-col">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-0 flex-1">
            {/* Sub-tabs */}
            <div className="flex items-center gap-1 px-4 pt-3 pb-0 border-b border-gray-100 shrink-0">
              {(["pendientes", "hechas"] as const).map((sub) => {
                const count = sub === "pendientes"
                  ? sorted.filter(o => !(o.contabilizado && o.declarado && o.pagado)).length
                  : sorted.filter(o => o.contabilizado && o.declarado && o.pagado).length;
                const active = listaSubTab === sub;
                return (
                  <button
                    key={sub}
                    onClick={() => setListaSubTab(sub)}
                    className={cn(
                      "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors capitalize flex items-center gap-1.5",
                      active
                        ? sub === "pendientes"
                          ? "border-orange-500 text-orange-600"
                          : "border-emerald-500 text-emerald-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                  >
                    {sub === "pendientes" ? "Pendientes" : "Hechas"}
                    <span className={cn(
                      "inline-flex items-center justify-center rounded-full text-xs font-bold px-1.5 py-0.5 min-w-[1.25rem]",
                      active
                        ? sub === "pendientes" ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-500"
                    )}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
            {loading ? (
              <div className="flex-1 py-16 text-center text-sm text-gray-400">Cargando obligaciones...</div>
            ) : (
              <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      {["Empresa","Tipo Obligación","Nivel","Periodicidad","Período","Año","Vencimiento","Días","Contabilizado","Declarado","Pagado","Responsable",""].map(col => (
                        <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50/60">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(() => {
                      const rows = listaSubTab === "pendientes"
                        ? sorted.filter(o => !(o.contabilizado && o.declarado && o.pagado))
                        : sorted.filter(o => o.contabilizado && o.declarado && o.pagado);
                      if (rows.length === 0) return (
                        <tr><td colSpan={13} className="px-4 py-12 text-center text-sm text-gray-400">
                          <div className="flex flex-col items-center gap-2">
                            <CalendarDays className="w-8 h-8 text-gray-200" />
                            <span>{listaSubTab === "pendientes" ? "No hay obligaciones pendientes" : "No hay obligaciones completadas"}</span>
                            {!loading && obligaciones.length === 0 && (
                              <button onClick={() => { setEditingObligacion(null); setShowForm(true); }} className="text-blue-600 hover:underline mt-1">
                                + Agregar primera obligación
                              </button>
                            )}
                          </div>
                        </td></tr>
                      );
                      return rows.map(o => {
                      const days = getDaysUntil(o.fechaVencimiento);
                      const isCompleted = o.estado === "PAGADO" || o.estado === "PRESENTADO";
                      return (
                        <tr key={o.id} className={cn("hover:bg-gray-50/80 transition-colors group", isCompleted && "opacity-70")}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: o.empresaColor }} />
                              <span className="font-medium text-gray-900 text-xs leading-tight max-w-[130px] truncate">{o.empresa}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap"><span className="text-gray-700 text-xs font-medium">{o.tipoObligacion}</span></td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={cn("text-xs rounded-full px-2 py-0.5 font-medium", o.municipio === "Nacional" ? "bg-slate-100 text-slate-600" : "bg-indigo-50 text-indigo-600")}>{o.municipio}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">{o.periodicidad}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">{getPeriodoLabel(o.periodo, o.periodicidad)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">{o.anio}</td>
                          <td className="px-4 py-3 whitespace-nowrap"><span className="text-xs font-mono text-gray-600">{formatDate(o.fechaVencimiento)}</span></td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {o.contabilizado && o.declarado && o.pagado ? (
                              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">✓ Hecho</span>
                            ) : (
                              <VencimientoBadge days={days} estado={o.estado} showText={true} />
                            )}
                          </td>
                          {/* Contabilizado */}
                          <td className="px-4 py-3 whitespace-nowrap">{renderDocCell(o, "contabilizado")}</td>
                          {/* Declarado */}
                          <td className="px-4 py-3 whitespace-nowrap">{renderDocCell(o, "declarado")}</td>
                          {/* Pagado */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex gap-1">
                              <button onClick={(e) => { e.stopPropagation(); handlePagadoChange(o.id, true); }}
                                className={cn("px-2.5 py-1 rounded-l-full text-xs font-semibold border transition-colors",
                                  o.pagado ? "bg-purple-500 text-white border-purple-500" : "bg-white text-gray-400 border-gray-200 hover:border-purple-400 hover:text-purple-600"
                                )}>Sí</button>
                              <button onClick={(e) => { e.stopPropagation(); handlePagadoChange(o.id, false); }}
                                className={cn("px-2.5 py-1 rounded-r-full text-xs font-semibold border transition-colors",
                                  !o.pagado ? "bg-gray-500 text-white border-gray-500" : "bg-white text-gray-400 border-gray-200 hover:border-gray-400 hover:text-gray-600"
                                )}>No</button>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap"><span className="text-xs text-gray-500 max-w-[110px] truncate block">{o.responsable}</span></td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <button onClick={() => { setEditingObligacion(o); setShowForm(true); }}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors" title="Editar">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDuplicate(o)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors" title="Duplicar">
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setAuditModal(o.id)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 bg-slate-50 hover:bg-slate-100 transition-colors" title="Ver auditoría">
                                <History className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDelete(o.id)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors" title="Eliminar">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            )}
            <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/30 shrink-0">
              <button onClick={() => { setEditingObligacion(null); setShowForm(true); }}
                className="flex items-center gap-2 text-xs text-gray-400 hover:text-blue-600 transition-colors group">
                <div className="w-6 h-6 rounded-full border-2 border-dashed border-gray-300 group-hover:border-blue-400 flex items-center justify-center transition-colors">
                  <Plus className="w-3 h-3" />
                </div>
                Agregar nueva obligación...
              </button>
            </div>
          </div>
        </TabsContent>

        {/* Calendario tab */}
        <TabsContent value="calendario" className="mt-4">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
            <CalendarioView obligaciones={filtered} />
          </div>
        </TabsContent>

        {/* Por Empresa tab */}
        <TabsContent value="empresa" className="mt-4">
          <div className="space-y-4">
            {Object.keys(groupedByEmpresa).length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                <Building2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No hay obligaciones que coincidan con los filtros</p>
              </div>
            ) : Object.entries(groupedByEmpresa).map(([empresa, empObs]) => {
              const vencidas = empObs.filter(o => o.estado === "VENCIDO").length;
              const completadas = empObs.filter(o => o.estado === "PAGADO" || o.estado === "PRESENTADO").length;
              const pendientes = empObs.filter(o => o.estado === "PENDIENTE" || o.estado === "EN_PROCESO").length;
              const color = empObs[0]?.empresaColor ?? "#3B82F6";

              return (
                <div key={empresa} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100" style={{ borderLeftColor: color, borderLeftWidth: "4px" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "20" }}>
                        <Building2 className="w-4 h-4" style={{ color }} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">{empresa}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{empObs.length} obligaciones</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {vencidas > 0 && <span className="text-xs font-semibold bg-red-100 text-red-700 border border-red-200 rounded-full px-2.5 py-1">{vencidas} vencida{vencidas > 1 ? "s" : ""}</span>}
                      {pendientes > 0 && <span className="text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200 rounded-full px-2.5 py-1">{pendientes} pendiente{pendientes > 1 ? "s" : ""}</span>}
                      {completadas > 0 && <span className="text-xs font-semibold bg-green-100 text-green-700 border border-green-200 rounded-full px-2.5 py-1">{completadas} completada{completadas > 1 ? "s" : ""}</span>}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50/50">
                          {["Tipo Obligación","Nivel","Periodicidad","Período / Año","Vencimiento","Días","Contabilizado","Declarado","Pagado","Responsable",""].map(col => (
                            <th key={col} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {empObs.map(o => {
                          const days = getDaysUntil(o.fechaVencimiento);
                          const isCompleted = o.estado === "PAGADO" || o.estado === "PRESENTADO";
                          return (
                            <tr key={o.id} className={cn("hover:bg-gray-50/60 transition-colors group", isCompleted && "opacity-60")}>
                              <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-800">{o.tipoObligacion}</td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={cn("rounded-full px-2 py-0.5 font-medium", o.municipio === "Nacional" ? "bg-slate-100 text-slate-600" : "bg-indigo-50 text-indigo-600")}>{o.municipio}</span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-gray-500">{o.periodicidad}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-gray-500">{getPeriodoLabel(o.periodo, o.periodicidad)} {o.anio}</td>
                              <td className="px-4 py-3 whitespace-nowrap font-mono text-gray-600">{formatDate(o.fechaVencimiento)}</td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {o.contabilizado && o.declarado && o.pagado ? (
                                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">✓ Hecho</span>
                                ) : <VencimientoBadge days={days} estado={o.estado} showText={true} />}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">{renderDocCell(o, "contabilizado", "xs")}</td>
                              <td className="px-4 py-3 whitespace-nowrap">{renderDocCell(o, "declarado", "xs")}</td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex gap-1">
                                  <button onClick={(e) => { e.stopPropagation(); handlePagadoChange(o.id, true); }}
                                    className={cn("px-2 py-0.5 rounded-l-full text-xs font-semibold border transition-colors",
                                      o.pagado ? "bg-purple-500 text-white border-purple-500" : "bg-white text-gray-400 border-gray-200 hover:border-purple-400 hover:text-purple-600"
                                    )}>Sí</button>
                                  <button onClick={(e) => { e.stopPropagation(); handlePagadoChange(o.id, false); }}
                                    className={cn("px-2 py-0.5 rounded-r-full text-xs font-semibold border transition-colors",
                                      !o.pagado ? "bg-gray-500 text-white border-gray-500" : "bg-white text-gray-400 border-gray-200 hover:border-gray-400 hover:text-gray-600"
                                    )}>No</button>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-gray-500 max-w-[120px] truncate">{o.responsable}</td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-1">
                                  <button onClick={() => { setEditingObligacion(o); setShowForm(true); }}
                                    className="w-6 h-6 flex items-center justify-center rounded text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors" title="Editar">
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button onClick={() => handleDuplicate(o)}
                                    className="w-6 h-6 flex items-center justify-center rounded text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors" title="Duplicar">
                                    <Copy className="w-3 h-3" />
                                  </button>
                                  <button onClick={() => setAuditModal(o.id)}
                                    className="w-6 h-6 flex items-center justify-center rounded text-slate-500 bg-slate-50 hover:bg-slate-100 transition-colors" title="Ver auditoría">
                                    <History className="w-3 h-3" />
                                  </button>
                                  <button onClick={() => handleDelete(o.id)}
                                    className="w-6 h-6 flex items-center justify-center rounded text-red-600 bg-red-50 hover:bg-red-100 transition-colors" title="Eliminar">
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
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Form Modal */}
      <ObligacionFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditingObligacion(null); }}
        onSave={handleSave}
        editingObligacion={editingObligacion}
        empresasList={empresasOptions.length > 0 ? empresasOptions : undefined}
      />

      {/* Upload Modal */}
      {uploadModal && (
        <UploadDocumentoModal
          open={true}
          tipo={uploadModal.tipo}
          obligacionId={uploadModal.obligacion.id}
          obligacionNombre={`${uploadModal.obligacion.empresa} — ${uploadModal.obligacion.tipoObligacion}`}
          documentoActual={{
            archivoNombre: uploadModal.tipo === "contabilizado"
              ? uploadModal.obligacion.contabilizadoArchivoNombre ?? null
              : uploadModal.obligacion.declaradoArchivoNombre ?? null,
            fecha: uploadModal.tipo === "contabilizado"
              ? uploadModal.obligacion.contabilizadoFecha ?? null
              : uploadModal.obligacion.declaradoFecha ?? null,
            porNombre: uploadModal.tipo === "contabilizado"
              ? uploadModal.obligacion.contabilizadoPorNombre ?? null
              : uploadModal.obligacion.declaradoPorNombre ?? null,
          }}
          onClose={() => setUploadModal(null)}
          onSuccess={(tipo, info) => { handleUploadSuccess(tipo, info); setUploadModal(null); }}
        />
      )}

      {/* Audit Modal */}
      <AuditoriaModal
        open={!!auditModal}
        obligacionId={auditModal ?? ""}
        onClose={() => setAuditModal(null)}
      />
    </div>
  );
}
