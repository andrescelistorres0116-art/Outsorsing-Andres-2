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
  empresaId: string;
  empresa: string;
  nombre: string;
  cedula: string;
  cargo: string;
  salario: string;
  tipoContrato: string;
  fechaIngreso: string;
  observaciones: string;
}

export interface EmpresaOption {
  id: string;
  name: string;
}

const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

interface Props {
  open: boolean;
  mes: number;
  anio: number;
  /** Pre-selected empresa. If omitted, empresaOptions must be provided. */
  empresa?: string;
  empresaId?: string;
  /** Used when the client must choose which empresa to report for. */
  empresaOptions?: EmpresaOption[];
  onClose: () => void;
  onSave: (data: IngresoFormData) => void;
}

const EMPTY_FIELDS = {
  nombre: "",
  cedula: "",
  cargo: "",
  salario: "",
  tipoContrato: "",
  fechaIngreso: "",
  observaciones: "",
};

export default function NovedadIngresoModal({
  open, mes, anio,
  empresa: empresaProp = "",
  empresaId: empresaIdProp = "",
  empresaOptions = [],
  onClose, onSave,
}: Props) {
  const [fields, setFields] = useState(EMPTY_FIELDS);
  const [selId, setSelId] = useState<string>(empresaIdProp);
  const [errors, setErrors] = useState<Partial<typeof EMPTY_FIELDS & { empresa: string }>>({});

  const resolvedEmpresa = empresaProp || (empresaOptions.find((e) => e.id === selId)?.name ?? "");
  const resolvedId = empresaIdProp || selId;
  const needsEmpresaSelect = !empresaProp && empresaOptions.length > 0;

  const set = (k: keyof typeof EMPTY_FIELDS, v: string) =>
    setFields((p) => ({ ...p, [k]: v }));

  function validate(): boolean {
    const e: typeof errors = {};
    if (needsEmpresaSelect && !resolvedEmpresa) e.empresa = "Seleccione una empresa";
    if (!fields.nombre.trim()) e.nombre = "Requerido";
    if (!fields.cedula.trim()) e.cedula = "Requerido";
    if (!fields.cargo.trim()) e.cargo = "Requerido";
    if (!fields.salario.trim()) e.salario = "Requerido";
    if (!fields.tipoContrato) e.tipoContrato = "Requerido";
    if (!fields.fechaIngreso) e.fechaIngreso = "Requerido";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    onSave({ empresaId: resolvedId, empresa: resolvedEmpresa, ...fields });
    setFields(EMPTY_FIELDS);
    setSelId(empresaIdProp);
    setErrors({});
  }

  function handleClose() {
    setFields(EMPTY_FIELDS);
    setSelId(empresaIdProp);
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
          {resolvedEmpresa && (
            <p className="text-xs text-gray-500 mt-1">
              {resolvedEmpresa} · {MESES[mes - 1]} {anio}
            </p>
          )}
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">

          {/* Empresa selector (when not pre-selected) */}
          {needsEmpresaSelect && (
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">
                Empresa <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selId ?? ""}
                onValueChange={(v) => setSelId(v)}
              >
                <SelectTrigger className={errors.empresa ? "border-red-400" : ""}>
                  <SelectValue placeholder="Seleccionar empresa..." />
                </SelectTrigger>
                <SelectContent>
                  {empresaOptions.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.empresa && <p className="text-xs text-red-500">{errors.empresa}</p>}
            </div>
          )}

          {/* Nombre */}
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              Nombre completo <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="Ej: María Camila Rodríguez"
              value={fields.nombre}
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
              value={fields.cedula}
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
              value={fields.cargo}
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
              value={fields.salario}
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
            <Select value={fields.tipoContrato} onValueChange={(v) => set("tipoContrato", v)}>
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
              value={fields.fechaIngreso}
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
              value={fields.observaciones}
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
