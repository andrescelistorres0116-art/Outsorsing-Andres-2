"use client";

import { useState } from "react";
import { User, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface PnFormData {
  nombresApellidos: string;
  numeroDocumento: string;
  nit: string;
  dv: string;
  direccion: string;
  ciudad: string;
  correo: string;
  telefono: string;
  estado: string;
  fechaInicioRelacion: string;
  fechaFinRelacion: string;
}

interface Errors {
  [key: string]: string;
}

const INITIAL: PnFormData = {
  nombresApellidos: "",
  numeroDocumento: "",
  nit: "",
  dv: "",
  direccion: "",
  ciudad: "",
  correo: "",
  telefono: "",
  estado: "ACTIVA",
  fechaInicioRelacion: "",
  fechaFinRelacion: "",
};

function validate(data: PnFormData): Errors {
  const errors: Errors = {};
  if (!data.nombresApellidos.trim()) errors.nombresApellidos = "Campo requerido";
  if (!data.nit.trim()) errors.nit = "Campo requerido";
  if (!data.dv.trim()) errors.dv = "Campo requerido";
  if (!data.ciudad.trim()) errors.ciudad = "Campo requerido";
  if (!data.fechaInicioRelacion) errors.fechaInicioRelacion = "Campo requerido";
  if (data.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.correo)) {
    errors.correo = "Correo inválido";
  }
  if (data.fechaFinRelacion && data.fechaInicioRelacion && data.fechaFinRelacion < data.fechaInicioRelacion) {
    errors.fechaFinRelacion = "Debe ser posterior a la fecha de inicio";
  }
  return errors;
}

// ── Field wrapper ──────────────────────────────────────────────────────────────

function Field({
  label, id, error, required, children,
}: {
  label: string; id: string; error?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: PnFormData) => void;
}

// ── Main Modal ─────────────────────────────────────────────────────────────────

export default function PersonaNaturalFormModal({ open, onClose, onSave }: Props) {
  const [form, setForm] = useState<PnFormData>(INITIAL);
  const [errors, setErrors] = useState<Errors>({});
  const [saved, setSaved] = useState(false);

  function handleChange(key: keyof PnFormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  }

  function handleSave() {
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave(form);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      handleClose();
    }, 1200);
  }

  function handleClose() {
    setForm(INITIAL);
    setErrors({});
    setSaved(false);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-600 shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
              Nueva Persona Natural
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 mt-1">
              Complete los campos para registrar una persona natural en Orbita AC
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Nombres y apellidos — full width */}
            <div className="sm:col-span-2">
              <Field label="Nombres y Apellidos" id="nombresApellidos" error={errors.nombresApellidos} required>
                <Input
                  id="nombresApellidos"
                  placeholder="Ej: Juan Carlos Pérez Gómez"
                  value={form.nombresApellidos}
                  onChange={(e) => handleChange("nombresApellidos", e.target.value)}
                  className={errors.nombresApellidos ? "border-red-400" : ""}
                />
              </Field>
            </div>

            {/* Número de documento + NIT + DV */}
            <Field label="Número de Documento" id="numeroDocumento" error={errors.numeroDocumento}>
              <Input
                id="numeroDocumento"
                placeholder="Cédula o pasaporte"
                value={form.numeroDocumento}
                onChange={(e) => handleChange("numeroDocumento", e.target.value)}
              />
            </Field>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <Field label="NIT" id="nit" error={errors.nit} required>
                  <Input
                    id="nit"
                    placeholder="900123456"
                    value={form.nit}
                    onChange={(e) => handleChange("nit", e.target.value)}
                    className={errors.nit ? "border-red-400" : ""}
                  />
                </Field>
              </div>
              <Field label="DV" id="dv" error={errors.dv} required>
                <Input
                  id="dv"
                  placeholder="0"
                  maxLength={1}
                  value={form.dv}
                  onChange={(e) => handleChange("dv", e.target.value)}
                  className={errors.dv ? "border-red-400" : ""}
                />
              </Field>
            </div>

            {/* Dirección — full width */}
            <div className="sm:col-span-2">
              <Field label="Dirección" id="direccion" error={errors.direccion}>
                <Input
                  id="direccion"
                  placeholder="Cra 15 # 93-75 Apto 302"
                  value={form.direccion}
                  onChange={(e) => handleChange("direccion", e.target.value)}
                />
              </Field>
            </div>

            <Field label="Ciudad" id="ciudad" error={errors.ciudad} required>
              <Input
                id="ciudad"
                placeholder="Bogotá"
                value={form.ciudad}
                onChange={(e) => handleChange("ciudad", e.target.value)}
                className={errors.ciudad ? "border-red-400" : ""}
              />
            </Field>

            <Field label="Correo Electrónico" id="correo" error={errors.correo}>
              <Input
                id="correo"
                type="email"
                placeholder="correo@ejemplo.co"
                value={form.correo}
                onChange={(e) => handleChange("correo", e.target.value)}
                className={errors.correo ? "border-red-400" : ""}
              />
            </Field>

            <Field label="Estado" id="estado" error={errors.estado} required>
              <Select value={form.estado} onValueChange={(v) => handleChange("estado", v)}>
                <SelectTrigger id="estado" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVA">Activa</SelectItem>
                  <SelectItem value="INACTIVA">Inactiva</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Teléfono" id="telefono" error={errors.telefono}>
              <Input
                id="telefono"
                placeholder="310 550 4400"
                value={form.telefono}
                onChange={(e) => handleChange("telefono", e.target.value)}
              />
            </Field>

            <Field label="Fecha Inicio Relación" id="fechaInicioRelacion" error={errors.fechaInicioRelacion} required>
              <Input
                id="fechaInicioRelacion"
                type="date"
                value={form.fechaInicioRelacion}
                onChange={(e) => handleChange("fechaInicioRelacion", e.target.value)}
                className={errors.fechaInicioRelacion ? "border-red-400" : ""}
              />
            </Field>

            <Field label="Fecha Fin Relación" id="fechaFinRelacion" error={errors.fechaFinRelacion}>
              <Input
                id="fechaFinRelacion"
                type="date"
                value={form.fechaFinRelacion}
                onChange={(e) => handleChange("fechaFinRelacion", e.target.value)}
                className={errors.fechaFinRelacion ? "border-red-400" : ""}
              />
              <p className="text-[11px] text-gray-400 mt-0.5">Opcional — dejar vacío si la relación sigue activa</p>
            </Field>

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-white flex items-center justify-between gap-3">
          <Button variant="outline" onClick={handleClose} className="text-sm text-gray-600">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saved}
            className={`gap-1.5 text-sm min-w-[120px] transition-all ${
              saved ? "bg-green-600 hover:bg-green-600 text-white" : "bg-violet-600 hover:bg-violet-700 text-white"
            }`}
          >
            {saved ? (
              <><Check className="w-4 h-4" /> Guardado</>
            ) : (
              <><Check className="w-4 h-4" /> Guardar Cliente</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
