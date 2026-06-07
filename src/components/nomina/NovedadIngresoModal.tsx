"use client";

import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { UserPlus } from "lucide-react";

export interface IngresoFormData {
  nombre: string;
  cedula: string;
  cargo: string;
  salario: string;
  tipoContrato: string;
  fechaIngreso: string;
  observaciones: string;
}

const EMPTY: IngresoFormData = {
  nombre: "",
  cedula: "",
  cargo: "",
  salario: "",
  tipoContrato: "",
  fechaIngreso: "",
  observaciones: "",
};

interface Props {
  open: boolean;
  empresa: string;
  mes: number;
  anio: number;
  onClose: () => void;
  onSave: (data: IngresoFormData) => void;
}

const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

export default function NovedadIngresoModal({ open, empresa, mes, anio, onClose, onSave }: Props) {
  const [form, setForm] = useState<IngresoFormData>(EMPTY);
  const [errors, setErrors] = useState<Partial<IngresoFormData>>({});

  const set = (k: keyof IngresoFormData, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  function validate(): boolean {
    const e: Partial<IngresoFormData> = {};
    if (!form.nombre.trim()) e.nombre = "Requerido";
    if (!form.cedula.trim()) e.cedula = "Requerido";
    if (!form.cargo.trim()) e.cargo = "Requerido";
    if (!form.salario.trim()) e.salario = "Requerido";
    if (!form.tipoContrato) e.tipoContrato = "Requerido";
    if (!form.fechaIngreso) e.fechaIngreso = "Requerido";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    onSave(form);
    setForm(EMPTY);
    setErrors({});
  }

  function handleClose() {
    setForm(EMPTY);
    setErrors({});
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 shrink-0">
              <UserPlus className="w-4 h-4 text-green-700" />
            </div>
            Reportar Ingreso de Empleado
          </DialogTitle>
          <p className="text-xs text-gray-500 mt-1">
            {empresa} · {MESES[mes - 1]} {anio}
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          {/* Nombre */}
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              Nombre completo <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="Ej: María Camila Rodríguez"
              value={form.nombre}
              onChange={(e) => set("nombre", e.target.value)}
              className={errors.nombre ? "border-red-400" : ""}
            />
            {errors.nombre && <p className="text-xs text-red-500">{errors.nombre}</p>}
          </div>

          {/* Cédula */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              Número de cédula <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="Ej: 1012345678"
              value={form.cedula}
              onChange={(e) => set("cedula", e.target.value)}
              className={errors.cedula ? "border-red-400" : ""}
            />
            {errors.cedula && <p className="text-xs text-red-500">{errors.cedula}</p>}
          </div>

          {/* Cargo */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              Cargo <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="Ej: Auxiliar Contable"
              value={form.cargo}
              onChange={(e) => set("cargo", e.target.value)}
              className={errors.cargo ? "border-red-400" : ""}
            />
            {errors.cargo && <p className="text-xs text-red-500">{errors.cargo}</p>}
          </div>

          {/* Salario */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              Salario mensual <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="Ej: 1.500.000"
              value={form.salario}
              onChange={(e) => set("salario", e.target.value)}
              className={errors.salario ? "border-red-400" : ""}
            />
            {errors.salario && <p className="text-xs text-red-500">{errors.salario}</p>}
          </div>

          {/* Tipo de contrato */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              Tipo de contrato <span className="text-red-500">*</span>
            </Label>
            <Select value={form.tipoContrato} onValueChange={(v) => set("tipoContrato", v)}>
              <SelectTrigger className={errors.tipoContrato ? "border-red-400" : ""}>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="indefinido">Término indefinido</SelectItem>
                <SelectItem value="fijo">Término fijo</SelectItem>
                <SelectItem value="obra_labor">Obra o labor</SelectItem>
                <SelectItem value="prestacion">Prestación de servicios</SelectItem>
                <SelectItem value="aprendizaje">Contrato de aprendizaje</SelectItem>
              </SelectContent>
            </Select>
            {errors.tipoContrato && <p className="text-xs text-red-500">{errors.tipoContrato}</p>}
          </div>

          {/* Fecha de ingreso */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              Fecha de ingreso <span className="text-red-500">*</span>
            </Label>
            <Input
              type="date"
              value={form.fechaIngreso}
              onChange={(e) => set("fechaIngreso", e.target.value)}
              className={errors.fechaIngreso ? "border-red-400" : ""}
            />
            {errors.fechaIngreso && <p className="text-xs text-red-500">{errors.fechaIngreso}</p>}
          </div>

          {/* Observaciones */}
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              Observaciones <span className="text-gray-400 font-normal">(opcional)</span>
            </Label>
            <Input
              placeholder="Información adicional relevante..."
              value={form.observaciones}
              onChange={(e) => set("observaciones", e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700 text-white gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Reportar Ingreso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
