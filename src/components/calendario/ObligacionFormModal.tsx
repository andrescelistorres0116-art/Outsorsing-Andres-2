"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Obligacion,
  EstadoObligacion,
  PeriodicidadObligacion,
  EMPRESAS,
  TIPOS_OBLIGACION,
  ESTADOS_LABELS,
} from "./mockData";

interface ObligacionFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (obligacion: Obligacion) => void;
  editingObligacion?: Obligacion | null;
}

const PERIODICIDADES: PeriodicidadObligacion[] = [
  "Mensual",
  "Bimestral",
  "Trimestral",
  "Cuatrimestral",
  "Semestral",
  "Anual",
];

type PeriodoOption = { value: number; label: string };

function getPeriodos(periodicidad: PeriodicidadObligacion): PeriodoOption[] {
  const M = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
             "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  switch (periodicidad) {
    case "Mensual":
      return M.map((label, i) => ({ value: i + 1, label }));
    case "Bimestral":
      return [
        { value: 1,  label: "Enero – Febrero" },
        { value: 3,  label: "Marzo – Abril" },
        { value: 5,  label: "Mayo – Junio" },
        { value: 7,  label: "Julio – Agosto" },
        { value: 9,  label: "Septiembre – Octubre" },
        { value: 11, label: "Noviembre – Diciembre" },
      ];
    case "Trimestral":
      return [
        { value: 1,  label: "Enero – Marzo" },
        { value: 4,  label: "Abril – Junio" },
        { value: 7,  label: "Julio – Septiembre" },
        { value: 10, label: "Octubre – Diciembre" },
      ];
    case "Cuatrimestral":
      return [
        { value: 1, label: "Enero – Abril" },
        { value: 5, label: "Mayo – Agosto" },
        { value: 9, label: "Septiembre – Diciembre" },
      ];
    case "Semestral":
      return [
        { value: 1, label: "Enero – Junio" },
        { value: 7, label: "Julio – Diciembre" },
      ];
    case "Anual":
      return [{ value: 1, label: "Año completo" }];
  }
}

const ESTADOS: { value: EstadoObligacion; label: string }[] = [
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "EN_PROCESO", label: "En Proceso" },
  { value: "PRESENTADO", label: "Presentado" },
  { value: "PAGADO", label: "Pagado" },
  { value: "VENCIDO", label: "Vencido" },
];

const MUNICIPIOS = [
  "Nacional",
  "Bogotá",
  "Medellín",
  "Cali",
  "Barranquilla",
  "Bucaramanga",
  "Cartagena",
  "Pereira",
  "Cúcuta",
  "Manizales",
  "Otro",
];

const RESPONSABLES = [
  "Andrés Torres",
  "María López",
  "Carlos Ramírez",
  "Ana Martínez",
  "Pedro Gómez",
  "Luisa Herrera",
  "Juan García",
  "Valentina Ruiz",
];


const EMPTY_FORM = {
  empresa: "",
  empresaColor: "#3B82F6",
  tipoObligacion: "",
  tipoPersonalizado: "",
  municipio: "Nacional",
  periodicidad: "Mensual" as PeriodicidadObligacion,
  periodo: 1,
  anio: 2026,
  fechaVencimiento: "",
  estado: "PENDIENTE" as EstadoObligacion,
  responsable: "",
  observaciones: "",
};

export default function ObligacionFormModal({
  open,
  onClose,
  onSave,
  editingObligacion,
}: ObligacionFormModalProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!editingObligacion;

  useEffect(() => {
    if (editingObligacion) {
      setForm({
        empresa: editingObligacion.empresa,
        empresaColor: editingObligacion.empresaColor,
        tipoObligacion:
          TIPOS_OBLIGACION.includes(editingObligacion.tipoObligacion)
            ? editingObligacion.tipoObligacion
            : "Personalizada",
        tipoPersonalizado: TIPOS_OBLIGACION.includes(
          editingObligacion.tipoObligacion
        )
          ? ""
          : editingObligacion.tipoObligacion,
        municipio: editingObligacion.municipio,
        periodicidad: editingObligacion.periodicidad,
        periodo: editingObligacion.periodo,
        anio: editingObligacion.anio,
        fechaVencimiento: editingObligacion.fechaVencimiento,
        estado: editingObligacion.estado,
        responsable: editingObligacion.responsable,
        observaciones: editingObligacion.observaciones || "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [editingObligacion, open]);

  function validate() {
    const newErrors: Record<string, string> = {};
    if (!form.empresa) newErrors.empresa = "Selecciona una empresa";
    if (!form.tipoObligacion) newErrors.tipoObligacion = "Selecciona el tipo";
    if (form.tipoObligacion === "Personalizada" && !form.tipoPersonalizado.trim())
      newErrors.tipoPersonalizado = "Ingresa el nombre del tipo";
    if (!form.fechaVencimiento) newErrors.fechaVencimiento = "Ingresa la fecha de vencimiento";
    if (!form.responsable.trim()) newErrors.responsable = "Ingresa el responsable";
    return newErrors;
  }

  function handleSubmit() {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    const empresaObj = EMPRESAS.find((e) => e.nombre === form.empresa);

    const obligacion: Obligacion = {
      id: editingObligacion?.id ?? Date.now().toString(),
      empresa: form.empresa,
      empresaColor: empresaObj?.color ?? form.empresaColor,
      tipoObligacion:
        form.tipoObligacion === "Personalizada"
          ? form.tipoPersonalizado.trim()
          : form.tipoObligacion,
      municipio: form.municipio,
      periodicidad: form.periodicidad,
      periodo: form.periodo,
      anio: form.anio,
      fechaVencimiento: form.fechaVencimiento,
      estado: form.estado,
      responsable: form.responsable.trim(),
      observaciones: form.observaciones.trim() || undefined,
      contabilizado: editingObligacion?.contabilizado ?? false,
      declarado: editingObligacion?.declarado ?? false,
      pagado: editingObligacion?.pagado ?? false,
    };

    setTimeout(() => {
      onSave(obligacion);
      setIsSubmitting(false);
      onClose();
    }, 200);
  }

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  const estadoColors: Record<EstadoObligacion, string> = {
    PENDIENTE: "text-gray-700",
    EN_PROCESO: "text-blue-700",
    PRESENTADO: "text-purple-700",
    PAGADO: "text-green-700",
    VENCIDO: "text-red-700",
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEditing ? "Editar Obligación" : "Nueva Obligación Tributaria"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          {/* Empresa */}
          <div className="sm:col-span-2">
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Empresa <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.empresa}
              onValueChange={(v) => setField("empresa", v)}
            >
              <SelectTrigger
                className={errors.empresa ? "border-red-400" : ""}
              >
                <SelectValue placeholder="Seleccionar empresa..." />
              </SelectTrigger>
              <SelectContent>
                {EMPRESAS.map((e) => (
                  <SelectItem key={e.nombre} value={e.nombre}>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: e.color }}
                      />
                      {e.nombre}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.empresa && (
              <p className="text-xs text-red-500 mt-1">{errors.empresa}</p>
            )}
          </div>

          {/* Tipo de Obligación */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Tipo de Obligación <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.tipoObligacion}
              onValueChange={(v) => setField("tipoObligacion", v)}
            >
              <SelectTrigger
                className={errors.tipoObligacion ? "border-red-400" : ""}
              >
                <SelectValue placeholder="Seleccionar tipo..." />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_OBLIGACION.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.tipoObligacion && (
              <p className="text-xs text-red-500 mt-1">{errors.tipoObligacion}</p>
            )}
          </div>

          {/* Tipo personalizado */}
          {form.tipoObligacion === "Personalizada" && (
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Nombre del Tipo <span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.tipoPersonalizado}
                onChange={(e) => setField("tipoPersonalizado", e.target.value)}
                placeholder="Ej: Declaración Municipal de Industria..."
                className={errors.tipoPersonalizado ? "border-red-400" : ""}
              />
              {errors.tipoPersonalizado && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.tipoPersonalizado}
                </p>
              )}
            </div>
          )}

          {/* Periodicidad */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Periodicidad
            </Label>
            <Select
              value={form.periodicidad}
              onValueChange={(v) => {
                const p = v as PeriodicidadObligacion;
                const firstPeriodo = getPeriodos(p)[0].value;
                setForm((prev) => ({ ...prev, periodicidad: p, periodo: firstPeriodo }));
                setErrors((prev) => ({ ...prev, periodicidad: "" }));
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODICIDADES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Municipio */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Municipio / Nivel
            </Label>
            <Select
              value={form.municipio}
              onValueChange={(v) => setField("municipio", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MUNICIPIOS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Período */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Período
            </Label>
            <Select
              value={String(form.periodo)}
              onValueChange={(v) => setField("periodo", Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getPeriodos(form.periodicidad).map((p) => (
                  <SelectItem key={p.value} value={String(p.value)}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Año */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Año
            </Label>
            <Select
              value={String(form.anio)}
              onValueChange={(v) => setField("anio", Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026, 2027].map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fecha de Vencimiento */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Fecha de Vencimiento <span className="text-red-500">*</span>
            </Label>
            <Input
              type="date"
              value={form.fechaVencimiento}
              onChange={(e) => setField("fechaVencimiento", e.target.value)}
              className={errors.fechaVencimiento ? "border-red-400" : ""}
            />
            {errors.fechaVencimiento && (
              <p className="text-xs text-red-500 mt-1">
                {errors.fechaVencimiento}
              </p>
            )}
          </div>

          {/* Estado */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Estado
            </Label>
            <Select
              value={form.estado}
              onValueChange={(v) => setField("estado", v as EstadoObligacion)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS.map((e) => (
                  <SelectItem key={e.value} value={e.value}>
                    <span className={estadoColors[e.value]}>{e.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Responsable */}
          <div className="sm:col-span-2">
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Responsable <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <Select
                value={
                  RESPONSABLES.includes(form.responsable) ? form.responsable : ""
                }
                onValueChange={(v) => setField("responsable", v)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {RESPONSABLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={form.responsable}
                onChange={(e) => setField("responsable", e.target.value)}
                placeholder="O escribir nombre..."
                className={cn("flex-1", errors.responsable ? "border-red-400" : "")}
              />
            </div>
            {errors.responsable && (
              <p className="text-xs text-red-500 mt-1">{errors.responsable}</p>
            )}
          </div>

          {/* Observaciones */}
          <div className="sm:col-span-2">
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Observaciones
            </Label>
            <Textarea
              value={form.observaciones}
              onChange={(e) => setField("observaciones", e.target.value)}
              placeholder="Notas adicionales sobre esta obligación..."
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Guardando...
              </span>
            ) : isEditing ? (
              "Actualizar"
            ) : (
              "Guardar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
