"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, CheckCircle2, Users, Plus, UserPlus, AlertCircle,
  FileText, Send, Eye, Undo2, RefreshCw, X, Loader2, Calendar, Pencil, Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { useAppSession } from "@/hooks/useAppSession";

// ── Types ──────────────────────────────────────────────────────────────────────

type EstadoReporte = "BORRADOR" | "ENVIADA" | "REVISADA" | "APROBADA" | "REABIERTA" | "CORREGIDA";
type PeriodoNomina = "MENSUAL" | "PRIMERA_QUINCENA" | "SEGUNDA_QUINCENA";
type TipoNovedad =
  | "BONIFICACIONES" | "COMISIONES" | "RETIRO" | "LIBRANZA" | "VACACIONES"
  | "HORAS_EXTRAS" | "HORAS_EXTRAS_NOCTURNAS" | "RECARGOS" | "DOMINICALES"
  | "LICENCIA" | "INCAPACIDAD" | "LLEGADA_TARDE" | "OTRA" | "INGRESO" | "AUSENCIA";

interface NovedadItem {
  id: string;
  empleadoId: string;
  tipoNovedad: TipoNovedad;
  valor?: string | null;
  horas?: string | null;
  diasAusencia?: number | null;
  fechaInicioNovedad?: string | null;
  fechaFinNovedad?: string | null;
  descripcion?: string | null;
  valorCuota?: string | null;
  libranzaId?: string | null;
  cuotaNumero?: number | null;
  numeroCuotas?: number | null;
}

interface EmpleadoItem {
  id: string;
  nombre: string;
  numeroDocumento: string;
  tipoDocumento?: string | null;
  cargo?: string | null;
  salarioBase?: string | null;
  eps?: string | null;
  fondoPensiones?: string | null;
  fechaIngreso?: string | null;
  activo: boolean;
}

interface Reporte {
  id: string;
  empresaId: string;
  empresa: {
    id: string; razonSocial: string; nit: string; nombreComercial?: string | null;
    modoFlujoNomina: string;
  };
  periodo: PeriodoNomina;
  mes: number;
  año: number;
  estado: EstadoReporte;
  sinNovedades: boolean;
  comentarios?: string | null;
  fechaInicioPeriodo?: string | null;
  fechaFinPeriodo?: string | null;
  novedades: NovedadItem[];
}

interface LibranzaExistente {
  id: string;
  entidad: string;
  valorCuota: string;
  cuotaActual: number;
  numeroCuotas: number;
  activa: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

function periodoLabel(p: PeriodoNomina) {
  if (p === "PRIMERA_QUINCENA") return "1ra Quincena (1–15)";
  if (p === "SEGUNDA_QUINCENA") return "2da Quincena (16–fin)";
  return "Mensual";
}

function lastDayOfMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getPeriodDates(mes: number, año: number, periodo: PeriodoNomina, fini?: string | null, ffin?: string | null) {
  if (fini && ffin) return { start: fini.split("T")[0], end: ffin.split("T")[0] };
  const last = lastDayOfMonth(año, mes);
  if (periodo === "PRIMERA_QUINCENA") return { start: `${año}-${String(mes).padStart(2,"0")}-01`, end: `${año}-${String(mes).padStart(2,"0")}-15` };
  if (periodo === "SEGUNDA_QUINCENA") return { start: `${año}-${String(mes).padStart(2,"0")}-16`, end: `${año}-${String(mes).padStart(2,"0")}-${last}` };
  return { start: `${año}-${String(mes).padStart(2,"0")}-01`, end: `${año}-${String(mes).padStart(2,"0")}-${last}` };
}

const ESTADO_CONFIG: Record<EstadoReporte, { label: string; variant: "secondary"|"warning"|"info"|"success"; Icon: React.ElementType }> = {
  BORRADOR:  { label: "Borrador",  variant: "secondary", Icon: FileText },
  ENVIADA:   { label: "Enviada",   variant: "warning",   Icon: Send },
  REVISADA:  { label: "Revisada",  variant: "info",      Icon: Eye },
  APROBADA:  { label: "Aprobada",  variant: "success",   Icon: CheckCircle2 },
  REABIERTA: { label: "Reabierta", variant: "warning",   Icon: Undo2 },
  CORREGIDA: { label: "Corregida", variant: "info",      Icon: RefreshCw },
};

const TIPOS_NOVEDAD: { value: TipoNovedad; label: string }[] = [
  { value: "BONIFICACIONES",       label: "Bonificación ocasional" },
  { value: "COMISIONES",           label: "Comisiones" },
  { value: "RETIRO",               label: "Retiro" },
  { value: "LIBRANZA",             label: "Libranza" },
  { value: "VACACIONES",           label: "Vacaciones" },
  { value: "HORAS_EXTRAS",         label: "Hora extra ordinaria" },
  { value: "HORAS_EXTRAS_NOCTURNAS", label: "Hora extra nocturna" },
  { value: "RECARGOS",             label: "Recargo nocturno" },
  { value: "DOMINICALES",          label: "Dominicales" },
  { value: "LICENCIA",             label: "Licencia de luto" },
  { value: "INCAPACIDAD",          label: "Incapacidad" },
  { value: "LLEGADA_TARDE",        label: "Llegadas tarde" },
  { value: "OTRA",                 label: "Otras novedades" },
];

function tipoLabel(t: TipoNovedad) {
  return TIPOS_NOVEDAD.find((x) => x.value === t)?.label ?? t;
}

function novedadChipLabel(n: NovedadItem) {
  const tipo = tipoLabel(n.tipoNovedad);
  if (n.tipoNovedad === "BONIFICACIONES" || n.tipoNovedad === "COMISIONES") {
    return `${tipo}: $${Number(n.valor ?? 0).toLocaleString("es-CO")}`;
  }
  if (n.tipoNovedad === "HORAS_EXTRAS" || n.tipoNovedad === "HORAS_EXTRAS_NOCTURNAS" || n.tipoNovedad === "RECARGOS" || n.tipoNovedad === "DOMINICALES") {
    return `${tipo}: ${n.horas}h`;
  }
  if (n.tipoNovedad === "LLEGADA_TARDE") return `${tipo}: ${n.diasAusencia} día(s)`;
  if (n.tipoNovedad === "RETIRO") return `Retiro: ${n.fechaFinNovedad ? n.fechaFinNovedad.split("T")[0] : ""}`;
  if (n.tipoNovedad === "LIBRANZA") return `Libranza: $${Number(n.valorCuota ?? 0).toLocaleString("es-CO")}`;
  if (n.tipoNovedad === "VACACIONES") return `Vacaciones: ${n.fechaInicioNovedad?.split("T")[0]} → ${n.fechaFinNovedad?.split("T")[0]}`;
  if (n.tipoNovedad === "LICENCIA") return `Luto: ${n.fechaInicioNovedad?.split("T")[0]} → ${n.fechaFinNovedad?.split("T")[0]}`;
  if (n.tipoNovedad === "INCAPACIDAD") return `Incap.: ${n.fechaInicioNovedad?.split("T")[0]} → ${n.fechaFinNovedad?.split("T")[0]}`;
  if (n.tipoNovedad === "OTRA") return `Otra: ${n.descripcion?.slice(0, 30)}${(n.descripcion?.length ?? 0) > 30 ? "…" : ""}`;
  return tipo;
}

const TIPOS_DOCUMENTOS = ["CC","CE","NIT","TI","PP","PEP","Otro"];
const TIPOS_CONTRATO = [
  { value: "indefinido",   label: "Término indefinido" },
  { value: "fijo",         label: "Término fijo" },
  { value: "obra_labor",   label: "Obra o labor" },
  { value: "prestacion",   label: "Prestación de servicios" },
  { value: "aprendizaje",  label: "Contrato de aprendizaje" },
];

// ── Add Novedad Modal ─────────────────────────────────────────────────────────

interface AddNovedadModalProps {
  open: boolean;
  empleadoId: string;
  empleadoNombre: string;
  reporteId: string;
  empresaId: string;
  periodo: PeriodoNomina;
  mes: number;
  año: number;
  periodStart: string;
  periodEnd: string;
  onClose: () => void;
  onSaved: (novedad: NovedadItem) => void;
  editNovedad?: NovedadItem;
  onUpdated?: (novedad: NovedadItem) => void;
}

function AddNovedadModal({ open, empleadoId, empleadoNombre, reporteId, empresaId, periodo, mes, año, periodStart, periodEnd, onClose, onSaved, editNovedad, onUpdated }: AddNovedadModalProps) {
  const [tipo, setTipo] = useState<TipoNovedad | "">("");
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [libranzas, setLibranzas] = useState<LibranzaExistente[]>([]);
  const [libranzaOpcion, setLibranzaOpcion] = useState<"existente" | "nueva">("existente");
  const [loadingLibranzas, setLoadingLibranzas] = useState(false);

  // Initialize / reset on open
  useEffect(() => {
    if (!open) { setTipo(""); setForm({}); setError(""); setLibranzas([]); return; }
    if (editNovedad) {
      setTipo(editNovedad.tipoNovedad);
      const init: Record<string, string> = {};
      if (editNovedad.valor) init.valor = editNovedad.valor;
      if (editNovedad.horas) init.horas = editNovedad.horas;
      if (editNovedad.diasAusencia != null) init.diasAusencia = String(editNovedad.diasAusencia);
      if (editNovedad.fechaInicioNovedad) init.fechaInicioNovedad = editNovedad.fechaInicioNovedad.split("T")[0];
      if (editNovedad.fechaFinNovedad) init.fechaFinNovedad = editNovedad.fechaFinNovedad.split("T")[0];
      if (editNovedad.descripcion) init.descripcion = editNovedad.descripcion;
      if (editNovedad.valorCuota) init.valorCuota = editNovedad.valorCuota;
      if (editNovedad.cuotaNumero != null) init.cuotaNumero = String(editNovedad.cuotaNumero);
      if (editNovedad.numeroCuotas != null) init.numeroCuotas = String(editNovedad.numeroCuotas);
      setForm(init);
    }
  }, [open, editNovedad?.id]);

  // Load libranzas when LIBRANZA type is selected
  useEffect(() => {
    if (tipo !== "LIBRANZA") return;
    setLoadingLibranzas(true);
    fetch(`/api/nomina/libranzas?empresaId=${empresaId}&empleadoId=${empleadoId}&activa=true`)
      .then((r) => r.json())
      .then((d) => {
        const list: LibranzaExistente[] = d.libranzas ?? [];
        setLibranzas(list);
        setLibranzaOpcion(list.length > 0 ? "existente" : "nueva");
      })
      .catch(() => setLibranzas([]))
      .finally(() => setLoadingLibranzas(false));
  }, [tipo, empleadoId, empresaId]);

  function set(field: string, value: string) { setForm((p) => ({ ...p, [field]: value })); }

  async function handleSubmit() {
    if (!tipo) { setError("Selecciona un tipo de novedad"); return; }
    setSaving(true); setError("");

    // ── EDIT MODE (PATCH) ────────────────────────────────────────────────────
    if (editNovedad) {
      const patch: Record<string, any> = {};
      switch (tipo) {
        case "BONIFICACIONES": case "COMISIONES":
          patch.valor = form.valor; patch.descripcion = form.descripcion || null; break;
        case "HORAS_EXTRAS": case "HORAS_EXTRAS_NOCTURNAS": case "RECARGOS": case "DOMINICALES":
          patch.horas = form.horas; patch.descripcion = form.descripcion || null; break;
        case "RETIRO":
          patch.fechaFinNovedad = form.fechaFinNovedad; break;
        case "INGRESO":
          patch.fechaInicioNovedad = form.fechaInicioNovedad; break;
        case "VACACIONES": case "LICENCIA": case "INCAPACIDAD":
          patch.fechaInicioNovedad = form.fechaInicioNovedad;
          patch.fechaFinNovedad = form.fechaFinNovedad;
          patch.descripcion = form.descripcion || null;
          break;
        case "LLEGADA_TARDE":
          patch.diasAusencia = Number(form.diasAusencia); patch.descripcion = form.descripcion || null; break;
        case "LIBRANZA":
          if (!form.valorCuota || Number(form.valorCuota) <= 0) { setSaving(false); setError("Valor cuota debe ser mayor que cero"); return; }
          if (!form.cuotaNumero || Number(form.cuotaNumero) <= 0) { setSaving(false); setError("Cuota # es requerida"); return; }
          patch.valorCuota = Number(form.valorCuota);
          patch.numeroCuotas = form.numeroCuotas ? parseInt(form.numeroCuotas) : undefined;
          patch.cuotaNumero = parseInt(form.cuotaNumero);
          break;
        default:
          patch.descripcion = form.descripcion || null;
      }
      const res = await fetch(`/api/nomina/novedades/${editNovedad.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      setSaving(false);
      if (res.ok) {
        const data = await res.json();
        onUpdated?.({ ...editNovedad, ...data });
        onClose();
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.details?.join(", ") ?? err.error ?? "Error al guardar");
      }
      return;
    }

    // ── CREATE MODE (POST) ───────────────────────────────────────────────────
    const payload: Record<string, any> = {
      empresaId, empleadoId, reporteId,
      periodo, mes, año, tipoNovedad: tipo,
    };

    switch (tipo) {
      case "BONIFICACIONES": case "COMISIONES":
        payload.valor = form.valor;
        payload.descripcion = form.descripcion || null;
        break;
      case "HORAS_EXTRAS": case "HORAS_EXTRAS_NOCTURNAS": case "RECARGOS": case "DOMINICALES":
        payload.horas = form.horas;
        payload.descripcion = form.descripcion || null;
        break;
      case "RETIRO":
        payload.fechaFinNovedad = form.fechaFinNovedad;
        break;
      case "VACACIONES": case "LICENCIA": case "INCAPACIDAD":
        payload.fechaInicioNovedad = form.fechaInicioNovedad;
        payload.fechaFinNovedad = form.fechaFinNovedad;
        payload.descripcion = form.descripcion || null;
        break;
      case "LLEGADA_TARDE":
        payload.diasAusencia = form.diasAusencia;
        payload.descripcion = form.descripcion || null;
        break;
      case "LIBRANZA":
        if (libranzaOpcion === "existente" && form.libranzaId) {
          payload.libranzaId = form.libranzaId;
          const lib = libranzas.find((l) => l.id === form.libranzaId);
          if (lib) payload.valorCuota = lib.valorCuota;
        } else {
          if (!form.entidad?.trim()) { setSaving(false); setError("Entidad es requerida"); return; }
          if (!form.valorCuota || Number(form.valorCuota) <= 0) { setSaving(false); setError("Valor cuota debe ser mayor que cero"); return; }
          if (!form.numeroCuotas || Number(form.numeroCuotas) <= 0) { setSaving(false); setError("Total cuotas debe ser mayor que cero"); return; }
          if (!form.cuotaActual || Number(form.cuotaActual) <= 0) { setSaving(false); setError("Cuota actual # es requerida"); return; }
          payload.entidad = form.entidad;
          payload.valorCuota = form.valorCuota;
          payload.numeroCuotas = form.numeroCuotas;
          payload.cuotaActual = form.cuotaActual;
          payload.fechaInicioNovedad = periodStart;
        }
        break;
      case "OTRA":
        payload.descripcion = form.descripcion;
        break;
    }

    const res = await fetch("/api/nomina/novedades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      onSaved(data);
      onClose();
    } else {
      const err = await res.json().catch(() => ({}));
      setError(err.details?.join(", ") ?? err.error ?? "Error al guardar");
    }
  }

  const f = (k: string) => form[k] ?? "";

  function renderFields() {
    switch (tipo) {
      case "BONIFICACIONES": case "COMISIONES":
        return (
          <>
            <FieldGroup label="Valor ($)">
              <Input type="number" min="1" placeholder="Ej: 500000" value={f("valor")} onChange={(e) => set("valor", e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Observación (opcional)">
              <Textarea rows={2} placeholder="Descripción..." value={f("descripcion")} onChange={(e) => set("descripcion", e.target.value)} />
            </FieldGroup>
          </>
        );
      case "HORAS_EXTRAS": case "HORAS_EXTRAS_NOCTURNAS": case "RECARGOS": case "DOMINICALES":
        return (
          <>
            <FieldGroup label="Cantidad de horas">
              <Input type="number" min="0.5" step="0.5" placeholder="Ej: 4" value={f("horas")} onChange={(e) => set("horas", e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Observación (opcional)">
              <Textarea rows={2} placeholder="Descripción..." value={f("descripcion")} onChange={(e) => set("descripcion", e.target.value)} />
            </FieldGroup>
          </>
        );
      case "RETIRO":
        return (
          <FieldGroup label="Fecha de retiro">
            <Input type="date" min={periodStart} max={periodEnd} value={f("fechaFinNovedad")} onChange={(e) => set("fechaFinNovedad", e.target.value)} />
            <p className="text-xs text-gray-400 mt-1">Debe pertenecer al período: {periodStart} → {periodEnd}</p>
          </FieldGroup>
        );
      case "VACACIONES": case "LICENCIA": case "INCAPACIDAD": {
        const labelTipo = tipo === "VACACIONES" ? "Vacaciones" : tipo === "LICENCIA" ? "Licencia de luto" : "Incapacidad";
        return (
          <>
            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label="Fecha inicio">
                <Input type="date" value={f("fechaInicioNovedad")} onChange={(e) => set("fechaInicioNovedad", e.target.value)} />
              </FieldGroup>
              <FieldGroup label="Fecha fin">
                <Input type="date" value={f("fechaFinNovedad")} onChange={(e) => set("fechaFinNovedad", e.target.value)} />
              </FieldGroup>
            </div>
            <FieldGroup label="Observación (opcional)">
              <Textarea rows={2} placeholder={`Detalles sobre ${labelTipo.toLowerCase()}...`} value={f("descripcion")} onChange={(e) => set("descripcion", e.target.value)} />
            </FieldGroup>
          </>
        );
      }
      case "LLEGADA_TARDE":
        return (
          <>
            <FieldGroup label="Cantidad de días">
              <Input type="number" min="1" placeholder="Ej: 2" value={f("diasAusencia")} onChange={(e) => set("diasAusencia", e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Observación (opcional)">
              <Textarea rows={2} placeholder="Descripción..." value={f("descripcion")} onChange={(e) => set("descripcion", e.target.value)} />
            </FieldGroup>
          </>
        );
      case "LIBRANZA":
        if (editNovedad) {
          return (
            <div className="grid grid-cols-3 gap-3">
              <FieldGroup label="Valor cuota ($) *">
                <Input type="number" min="1" value={f("valorCuota")} onChange={(e) => set("valorCuota", e.target.value)} />
              </FieldGroup>
              <FieldGroup label="Total cuotas *">
                <Input type="number" min="1" value={f("numeroCuotas")} onChange={(e) => set("numeroCuotas", e.target.value)} />
              </FieldGroup>
              <FieldGroup label="Cuota # *">
                <Input type="number" min="1" value={f("cuotaNumero")} onChange={(e) => set("cuotaNumero", e.target.value)} />
              </FieldGroup>
            </div>
          );
        }
        if (loadingLibranzas) return <p className="text-sm text-gray-400">Cargando libranzas...</p>;
        return (
          <div className="space-y-4">
            {libranzas.length > 0 && (
              <div className="flex gap-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" checked={libranzaOpcion === "existente"} onChange={() => setLibranzaOpcion("existente")} />
                  Libranza existente
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" checked={libranzaOpcion === "nueva"} onChange={() => setLibranzaOpcion("nueva")} />
                  Nueva libranza
                </label>
              </div>
            )}
            {libranzaOpcion === "existente" && libranzas.length > 0 ? (
              <FieldGroup label="Seleccionar libranza">
                <Select value={f("libranzaId")} onValueChange={(v) => set("libranzaId", v)}>
                  <SelectTrigger><SelectValue placeholder="Elige una libranza..." /></SelectTrigger>
                  <SelectContent>
                    {libranzas.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.entidad} — Cuota {l.cuotaActual}/{l.numeroCuotas} — ${Number(l.valorCuota).toLocaleString("es-CO")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldGroup>
            ) : (
              <>
                <FieldGroup label="Entidad (banco o cooperativa) *">
                  <Input placeholder="Ej: Bancolombia" value={f("entidad")} onChange={(e) => set("entidad", e.target.value)} />
                </FieldGroup>
                <div className="grid grid-cols-3 gap-3">
                  <FieldGroup label="Valor cuota ($) *">
                    <Input type="number" min="1" placeholder="Ej: 250000" value={f("valorCuota")} onChange={(e) => set("valorCuota", e.target.value)} />
                  </FieldGroup>
                  <FieldGroup label="Total cuotas *">
                    <Input type="number" min="1" placeholder="Ej: 24" value={f("numeroCuotas")} onChange={(e) => set("numeroCuotas", e.target.value)} />
                  </FieldGroup>
                  <FieldGroup label="Cuota actual # *">
                    <Input type="number" min="1" placeholder="Ej: 3" value={f("cuotaActual")} onChange={(e) => set("cuotaActual", e.target.value)} />
                  </FieldGroup>
                </div>
              </>
            )}
          </div>
        );
      case "OTRA":
        return (
          <FieldGroup label="Observación (obligatoria)">
            <Textarea rows={3} placeholder="Describe la novedad..." value={f("descripcion")} onChange={(e) => set("descripcion", e.target.value)} />
          </FieldGroup>
        );
      default:
        return null;
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">{editNovedad ? "Editar Novedad" : "Agregar Novedad"}</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">{empleadoNombre}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <FieldGroup label="Tipo de novedad">
            {editNovedad ? (
              <div className="px-3 py-2 rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-700">
                {tipoLabel(editNovedad.tipoNovedad)}
              </div>
            ) : (
              <Select value={tipo} onValueChange={(v) => { setTipo(v as TipoNovedad); setForm({}); setError(""); }}>
                <SelectTrigger><SelectValue placeholder="Selecciona un tipo..." /></SelectTrigger>
                <SelectContent>
                  {TIPOS_NOVEDAD.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FieldGroup>

          {tipo && renderFields()}

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={handleSubmit}
            disabled={saving || !tipo}
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-1" />Guardando…</> : editNovedad ? "Guardar Cambios" : "Guardar Novedad"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Ingreso Modal ─────────────────────────────────────────────────────────────

interface IngresoModalProps {
  open: boolean;
  reporteId: string;
  empresaId: string;
  periodo: PeriodoNomina;
  mes: number;
  año: number;
  onClose: () => void;
  onSaved: (empleado: EmpleadoItem) => void;
}

function IngresoModal({ open, reporteId, empresaId, periodo, mes, año, onClose, onSaved }: IngresoModalProps) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (!open) { setForm({}); setError(""); } }, [open]);

  function set(field: string, value: string) { setForm((p) => ({ ...p, [field]: value })); }
  const f = (k: string) => form[k] ?? "";

  async function handleSubmit() {
    const required = ["tipoDocumento", "numeroDocumento", "nombre", "fechaIngreso", "tipoContrato", "salarioBase"];
    const missing = required.filter((k) => !f(k).trim());
    if (missing.length) { setError("Todos los campos obligatorios deben completarse"); return; }

    setSaving(true); setError("");

    // 1. Create employee
    const empRes = await fetch("/api/nomina/empleados", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        empresaId,
        tipoDocumento: f("tipoDocumento"),
        numeroDocumento: f("numeroDocumento").trim(),
        nombre: f("nombre").trim(),
        cargo: f("cargo").trim() || null,
        salarioBase: f("salarioBase"),
        tipoContrato: f("tipoContrato"),
        eps: f("eps").trim() || null,
        fondoPensiones: f("fondoPensiones").trim() || null,
        fechaIngreso: f("fechaIngreso"),
      }),
    });

    if (!empRes.ok) {
      const err = await empRes.json().catch(() => ({}));
      setSaving(false);
      setError(err.details?.join(", ") ?? err.error ?? "Error al crear empleado");
      return;
    }

    const empleado = await empRes.json();

    // 2. Register INGRESO novedad
    await fetch("/api/nomina/novedades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        empresaId,
        empleadoId: empleado.id,
        reporteId,
        periodo,
        mes,
        año,
        tipoNovedad: "INGRESO",
        fechaInicioNovedad: f("fechaIngreso"),
        descripcion: f("observaciones").trim() || null,
      }),
    });

    setSaving(false);
    onSaved({
      id: empleado.id,
      nombre: empleado.nombre,
      numeroDocumento: empleado.numeroDocumento,
      tipoDocumento: empleado.tipoDocumento,
      cargo: empleado.cargo,
      salarioBase: empleado.salarioBase?.toString() ?? null,
      eps: empleado.eps,
      fondoPensiones: empleado.fondoPensiones,
      fechaIngreso: empleado.fechaIngreso,
      activo: true,
    });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Reportar Ingreso de Empleado</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            {MESES[mes - 1]} {año}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1 max-h-[60vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Tipo documento *">
              <Select value={f("tipoDocumento")} onValueChange={(v) => set("tipoDocumento", v)}>
                <SelectTrigger><SelectValue placeholder="Tipo..." /></SelectTrigger>
                <SelectContent>
                  {TIPOS_DOCUMENTOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </FieldGroup>
            <FieldGroup label="Número documento *">
              <Input placeholder="Ej: 12345678" value={f("numeroDocumento")} onChange={(e) => set("numeroDocumento", e.target.value)} />
            </FieldGroup>
          </div>
          <FieldGroup label="Nombre completo *">
            <Input placeholder="Nombres y apellidos" value={f("nombre")} onChange={(e) => set("nombre", e.target.value)} />
          </FieldGroup>
          <FieldGroup label="Cargo">
            <Input placeholder="Ej: Auxiliar administrativo" value={f("cargo")} onChange={(e) => set("cargo", e.target.value)} />
          </FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Fecha de ingreso *">
              <Input type="date" value={f("fechaIngreso")} onChange={(e) => set("fechaIngreso", e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Salario básico ($) *">
              <Input type="number" min="1" placeholder="Ej: 1300000" value={f("salarioBase")} onChange={(e) => set("salarioBase", e.target.value)} />
            </FieldGroup>
          </div>
          <FieldGroup label="Tipo de contrato *">
            <Select value={f("tipoContrato")} onValueChange={(v) => set("tipoContrato", v)}>
              <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
              <SelectContent>
                {TIPOS_CONTRATO.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="EPS">
              <Input placeholder="Ej: Sura" value={f("eps")} onChange={(e) => set("eps", e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Fondo de pensiones">
              <Input placeholder="Ej: Protección" value={f("fondoPensiones")} onChange={(e) => set("fondoPensiones", e.target.value)} />
            </FieldGroup>
          </div>
          <FieldGroup label="Observaciones">
            <Textarea rows={2} placeholder="Notas adicionales..." value={f("observaciones")} onChange={(e) => set("observaciones", e.target.value)} />
          </FieldGroup>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mt-2">{error}</p>
        )}

        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-1" />Guardando…</> : "Registrar Empleado"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Field Group helper ────────────────────────────────────────────────────────

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-gray-700">{label}</label>
      {children}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function NominaDetallePage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { appSession } = useAppSession();

  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [empleados, setEmpleados] = useState<EmpleadoItem[]>([]);
  const [novedadesPorEmpleado, setNovedadesPorEmpleado] = useState<Record<string, NovedadItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  // Modal state
  const [novedadModal, setNovedadModal] = useState<{ empleadoId: string; nombre: string } | null>(null);
  const [editModal, setEditModal] = useState<{ novedad: NovedadItem; nombre: string } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ novedad: NovedadItem; nombre: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmAprobar, setConfirmAprobar] = useState(false);
  const [ingresoModal, setIngresoModal] = useState(false);
  const [finalLoading, setFinalLoading] = useState(false);
  const [finalError, setFinalError] = useState("");

  const loadReporte = useCallback(async () => {
    if (!id) return;
    setLoading(true); setPageError("");
    const res = await fetch(`/api/nomina/reportes/${id}`);
    if (!res.ok) { setPageError("No se pudo cargar el reporte"); setLoading(false); return; }
    const data: Reporte = await res.json();
    setReporte(data);
    // Group novedades by employee
    const grouped: Record<string, NovedadItem[]> = {};
    for (const n of data.novedades) {
      if (!grouped[n.empleadoId]) grouped[n.empleadoId] = [];
      grouped[n.empleadoId].push(n);
    }
    setNovedadesPorEmpleado(grouped);
    setLoading(false);
  }, [id]);

  useEffect(() => { loadReporte(); }, [loadReporte]);

  // Load employees once report is available
  useEffect(() => {
    if (!reporte) return;
    const { start, end } = getPeriodDates(reporte.mes, reporte.año, reporte.periodo, reporte.fechaInicioPeriodo, reporte.fechaFinPeriodo);
    fetch(`/api/nomina/empleados?empresaId=${reporte.empresaId}&fechaIni=${start}&fechaFin=${end}&limit=200`)
      .then((r) => r.json())
      .then((d) => setEmpleados(Array.isArray(d.empleados) ? d.empleados : []))
      .catch(() => setEmpleados([]));
  }, [reporte?.id, reporte?.empresaId]);

  const isEditable = reporte?.estado === "BORRADOR" || reporte?.estado === "REABIERTA";
  const isCliente = appSession?.role === "cliente";
  const isContador = appSession?.role === "contador" || appSession?.role === "admin";
  const modoCompleto = reporte?.empresa.modoFlujoNomina === "COMPLETO";

  // In COMPLETO mode: BORRADOR→ENVIADA, REABIERTA→CORREGIDA. In SIMPLE: always →APROBADA
  const estadoDestino = modoCompleto
    ? (reporte?.estado === "REABIERTA" ? "CORREGIDA" : "ENVIADA")
    : "APROBADA";
  const btnFinalizarLabel = modoCompleto
    ? (reporte?.estado === "REABIERTA" ? "ENVIAR CORRECCIÓN" : "ENVIAR NÓMINA")
    : "FINALIZAR NÓMINA";

  const periodDates = reporte
    ? getPeriodDates(reporte.mes, reporte.año, reporte.periodo, reporte.fechaInicioPeriodo, reporte.fechaFinPeriodo)
    : null;

  async function transicionarEstado(estadoNuevo: string) {
    setFinalLoading(true); setFinalError("");
    const res = await fetch(`/api/nomina/reportes/${id}/estado`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estadoNuevo }),
    });
    if (res.ok) {
      await loadReporte();
    } else {
      const err = await res.json().catch(() => ({}));
      setFinalError(err.error ?? "Error al cambiar estado");
    }
    setFinalLoading(false);
  }

  async function handleNoHayNovedades() {
    setFinalLoading(true); setFinalError("");
    await fetch(`/api/nomina/reportes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sinNovedades: true }),
    });
    await transicionarEstado(estadoDestino);
  }

  function handleNovedadSaved(novedad: NovedadItem) {
    setNovedadesPorEmpleado((prev) => ({
      ...prev,
      [novedad.empleadoId]: [...(prev[novedad.empleadoId] ?? []), novedad],
    }));
  }

  function handleEmpleadoCreado(empleado: EmpleadoItem) {
    setEmpleados((prev) => [...prev, empleado]);
  }

  function handleNovedadUpdated(novedad: NovedadItem) {
    setNovedadesPorEmpleado((prev) => ({
      ...prev,
      [novedad.empleadoId]: (prev[novedad.empleadoId] ?? []).map((n) => n.id === novedad.id ? novedad : n),
    }));
  }

  async function handleDeleteConfirmed() {
    if (!deleteModal) return;
    setDeleteLoading(true);
    const res = await fetch(`/api/nomina/novedades/${deleteModal.novedad.id}`, { method: "DELETE" });
    if (res.ok) {
      const { novedad } = deleteModal;
      setNovedadesPorEmpleado((prev) => ({
        ...prev,
        [novedad.empleadoId]: (prev[novedad.empleadoId] ?? []).filter((n) => n.id !== novedad.id),
      }));
      setDeleteModal(null);
    }
    setDeleteLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (pageError || !reporte) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-gray-500">{pageError || "Reporte no encontrado"}</p>
        <Button variant="outline" onClick={() => router.back()}>Volver</Button>
      </div>
    );
  }

  const estadoCfg = ESTADO_CONFIG[reporte.estado];
  const EstadoIcon = estadoCfg.Icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors shrink-0 mt-0.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-gray-900 truncate">
              {reporte.empresa.nombreComercial ?? reporte.empresa.razonSocial}
            </h1>
            <span className="text-xs font-mono text-gray-400">{reporte.empresa.nit}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {periodoLabel(reporte.periodo)} — {MESES[reporte.mes - 1]} {reporte.año}
            </span>
            {periodDates && (
              <span className="text-xs text-gray-400">({periodDates.start} → {periodDates.end})</span>
            )}
          </div>
        </div>

        <Badge variant={estadoCfg.variant} className="gap-1 shrink-0 self-start sm:self-center">
          <EstadoIcon className="w-3.5 h-3.5" />
          {estadoCfg.label}
        </Badge>
      </div>

      {/* Action bar */}
      {isEditable && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
          <Button
            onClick={() => setIngresoModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white gap-2"
            size="sm"
          >
            <UserPlus className="w-4 h-4" />
            Reportar Ingreso de Empleado
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleNoHayNovedades}
              disabled={finalLoading}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {finalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "NO HAY NOVEDADES DE NÓMINA"}
            </Button>
            <Button
              size="sm"
              onClick={() => isCliente ? setConfirmAprobar(true) : transicionarEstado(estadoDestino)}
              disabled={finalLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {finalLoading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : isCliente ? "APROBAR NOVEDADES DE NÓMINA" : btnFinalizarLabel}
            </Button>
          </div>
        </div>
      )}

      {/* Contador/Admin actions for COMPLETO flow */}
      {isContador && !isEditable && reporte.estado === "ENVIADA" && (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => transicionarEstado("REVISADA")} disabled={finalLoading} className="bg-blue-600 hover:bg-blue-700 text-white">Marcar Revisada</Button>
        </div>
      )}
      {isContador && !isEditable && reporte.estado === "REVISADA" && (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => transicionarEstado("APROBADA")} disabled={finalLoading} className="bg-green-600 hover:bg-green-700 text-white">Aprobar</Button>
        </div>
      )}
      {appSession?.role === "admin" && reporte.estado === "APROBADA" && (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => transicionarEstado("REABIERTA")} disabled={finalLoading} className="border-orange-300 text-orange-700 hover:bg-orange-50">Reabrir nómina</Button>
        </div>
      )}

      {/* Final error */}
      {finalError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {finalError}
        </div>
      )}

      {/* Approved state banner */}
      {reporte.estado === "APROBADA" && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">Nómina aprobada</p>
            {reporte.sinNovedades && <p className="text-xs text-green-600">Sin novedades reportadas en este período.</p>}
          </div>
        </div>
      )}

      {/* Employee list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            Empleados activos en este período
            <span className="text-xs font-normal text-gray-400">({empleados.length})</span>
          </h2>
        </div>

        {empleados.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No hay empleados activos para este período</p>
              {isEditable && (
                <p className="text-gray-400 text-sm mt-1">
                  Usa <span className="font-semibold text-green-700">Reportar Ingreso de Empleado</span> para agregar el primero.
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {empleados.map((emp) => {
              const novs = novedadesPorEmpleado[emp.id] ?? [];
              const tieneRetiro = novs.some((n) => n.tipoNovedad === "RETIRO");
              return (
                <Card key={emp.id} className={tieneRetiro ? "border-red-100 bg-red-50/30" : ""}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      {/* Employee info */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-50 shrink-0">
                          <Users className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{emp.nombre}</p>
                          <p className="text-xs text-gray-500">
                            {emp.tipoDocumento ?? "CC"} {emp.numeroDocumento}
                            {emp.cargo && <> — {emp.cargo}</>}
                          </p>
                          {emp.salarioBase && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              Salario: ${Number(emp.salarioBase).toLocaleString("es-CO")}
                            </p>
                          )}
                          {tieneRetiro && (
                            <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-red-600 bg-red-100 border border-red-200 rounded-full px-2 py-0.5">
                              Retirado este período
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Novedades + action */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {isEditable && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 gap-1.5 text-xs"
                            onClick={() => setNovedadModal({ empleadoId: emp.id, nombre: emp.nombre })}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Agregar Novedad
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Novedades chips */}
                    {novs.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100">
                        {novs.map((n) => (
                          <span
                            key={n.id}
                            className="inline-flex items-center gap-1 text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full px-2.5 py-0.5"
                          >
                            {novedadChipLabel(n)}
                            {isEditable && (
                              <>
                                <button
                                  title="Editar"
                                  onClick={() => setEditModal({ novedad: n, nombre: emp.nombre })}
                                  className="ml-0.5 text-indigo-400 hover:text-indigo-700 transition-colors"
                                >
                                  <Pencil className="w-2.5 h-2.5" />
                                </button>
                                <button
                                  title="Eliminar"
                                  onClick={() => setDeleteModal({ novedad: n, nombre: emp.nombre })}
                                  className="text-red-400 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              </>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Novedad Modal */}
      {novedadModal && periodDates && (
        <AddNovedadModal
          open={!!novedadModal}
          empleadoId={novedadModal.empleadoId}
          empleadoNombre={novedadModal.nombre}
          reporteId={id}
          empresaId={reporte.empresaId}
          periodo={reporte.periodo}
          mes={reporte.mes}
          año={reporte.año}
          periodStart={periodDates.start}
          periodEnd={periodDates.end}
          onClose={() => setNovedadModal(null)}
          onSaved={handleNovedadSaved}
        />
      )}

      {/* Ingreso Modal */}
      <IngresoModal
        open={ingresoModal}
        reporteId={id}
        empresaId={reporte.empresaId}
        periodo={reporte.periodo}
        mes={reporte.mes}
        año={reporte.año}
        onClose={() => setIngresoModal(false)}
        onSaved={handleEmpleadoCreado}
      />

      {/* Edit Novedad Modal */}
      {editModal && periodDates && (
        <AddNovedadModal
          open={!!editModal}
          empleadoId={editModal.novedad.empleadoId}
          empleadoNombre={editModal.nombre}
          reporteId={id}
          empresaId={reporte.empresaId}
          periodo={reporte.periodo}
          mes={reporte.mes}
          año={reporte.año}
          periodStart={periodDates.start}
          periodEnd={periodDates.end}
          onClose={() => setEditModal(null)}
          onSaved={() => {}}
          editNovedad={editModal.novedad}
          onUpdated={(n) => { handleNovedadUpdated(n); setEditModal(null); }}
        />
      )}

      {/* Confirm Aprobar Novedades Dialog (client only) */}
      <Dialog open={confirmAprobar} onOpenChange={(o) => { if (!o && !finalLoading) setConfirmAprobar(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Aprobar novedades de nómina</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              ¿Está seguro de aprobar estas novedades? Una vez enviadas, el contador de Outsoursing Andrés
              las revisará y no podrá realizar cambios hasta que el reporte sea reabierto.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setConfirmAprobar(false)} disabled={finalLoading}>
              Cancelar
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={finalLoading}
              onClick={async () => {
                setConfirmAprobar(false);
                await transicionarEstado(estadoDestino);
              }}
            >
              {finalLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-1" />Enviando…</> : "Sí, aprobar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {deleteModal && (
        <Dialog open={!!deleteModal} onOpenChange={(o) => { if (!o && !deleteLoading) setDeleteModal(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">Eliminar Novedad</DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                ¿Eliminar <strong>{novedadChipLabel(deleteModal.novedad)}</strong> de{" "}
                <strong>{deleteModal.nombre}</strong>? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 mt-2">
              <Button variant="outline" onClick={() => setDeleteModal(null)} disabled={deleteLoading}>
                Cancelar
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDeleteConfirmed}
                disabled={deleteLoading}
              >
                {deleteLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-1" />Eliminando…</> : "Eliminar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
