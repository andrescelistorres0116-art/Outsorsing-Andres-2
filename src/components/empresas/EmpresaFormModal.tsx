"use client";

import { useState } from "react";
import {
  Building2,
  UserCircle2,
  CreditCard,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Check,
} from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Types ──────────────────────────────────────────────────────────────────────

interface FormData {
  // Paso 1 — Datos Básicos
  razonSocial: string;
  nombreComercial: string;
  nit: string;
  dv: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  telefono: string;
  correo: string;
  estado: string;
  // Paso 2 — Representante Legal
  repNombre: string;
  repCedula: string;
  repCorreo: string;
  repTelefono: string;
  // Paso 3 — Tributario
  regimen: string;
  responsabilidadIVA: string;
  obligadoFacturar: boolean;
  actividadEconomica: string;
  tipoContribuyente: string;
  agenteRetenedor: boolean;
  // Paso 4 — Contable
  softwareContable: string;
  tipoNomina: string;
  periodicidadNomina: string;
}

interface Errors {
  [key: string]: string;
}

const INITIAL_FORM: FormData = {
  razonSocial: "",
  nombreComercial: "",
  nit: "",
  dv: "",
  direccion: "",
  ciudad: "",
  departamento: "",
  telefono: "",
  correo: "",
  estado: "ACTIVA",
  repNombre: "",
  repCedula: "",
  repCorreo: "",
  repTelefono: "",
  regimen: "",
  responsabilidadIVA: "",
  obligadoFacturar: true,
  actividadEconomica: "",
  tipoContribuyente: "Persona Jurídica",
  agenteRetenedor: false,
  softwareContable: "",
  tipoNomina: "",
  periodicidadNomina: "",
};

// ── Step definitions ───────────────────────────────────────────────────────────

const STEPS = [
  {
    id: 1,
    label: "Datos Básicos",
    icon: Building2,
    description: "Identificación y contacto",
  },
  {
    id: 2,
    label: "Representante",
    icon: UserCircle2,
    description: "Rep. legal de la empresa",
  },
  {
    id: 3,
    label: "Tributario",
    icon: CreditCard,
    description: "Régimen y obligaciones",
  },
  {
    id: 4,
    label: "Contable",
    icon: BookOpen,
    description: "Software y nómina",
  },
];

// ── Validation ─────────────────────────────────────────────────────────────────

function validateStep(step: number, data: FormData): Errors {
  const errors: Errors = {};
  if (step === 1) {
    if (!data.razonSocial.trim()) errors.razonSocial = "Campo requerido";
    if (!data.nit.trim()) errors.nit = "Campo requerido";
    if (!data.dv.trim()) errors.dv = "Campo requerido";
    if (!data.ciudad.trim()) errors.ciudad = "Campo requerido";
    if (!data.departamento.trim()) errors.departamento = "Campo requerido";
    if (data.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.correo)) {
      errors.correo = "Correo inválido";
    }
  }
  if (step === 2) {
    if (!data.repNombre.trim()) errors.repNombre = "Campo requerido";
    if (!data.repCedula.trim()) errors.repCedula = "Campo requerido";
  }
  if (step === 3) {
    if (!data.regimen) errors.regimen = "Seleccione un régimen";
    if (!data.tipoContribuyente) errors.tipoContribuyente = "Campo requerido";
    if (!data.actividadEconomica.trim())
      errors.actividadEconomica = "Campo requerido";
  }
  return errors;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  id: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

function Field({ label, id, error, required, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">{error}</p>
      )}
    </div>
  );
}

// ── Progress Indicator ─────────────────────────────────────────────────────────

function StepProgress({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, idx) => {
        const done = step.id < current;
        const active = step.id === current;
        const Icon = step.icon;

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all ${
                  done
                    ? "bg-blue-600 border-blue-600 text-white"
                    : active
                    ? "border-blue-600 text-blue-600 bg-blue-50"
                    : "border-gray-200 text-gray-400 bg-white"
                }`}
              >
                {done ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
              </div>
              <div className="mt-1.5 text-center hidden sm:block">
                <p
                  className={`text-[11px] font-semibold leading-none ${
                    active ? "text-blue-600" : done ? "text-gray-600" : "text-gray-400"
                  }`}
                >
                  {step.label}
                </p>
              </div>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-8 sm:w-14 mx-1 mb-4 transition-colors ${
                  step.id < current ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Step forms ─────────────────────────────────────────────────────────────────

function Step1({
  data,
  errors,
  onChange,
}: {
  data: FormData;
  errors: Errors;
  onChange: (key: keyof FormData, value: string | boolean) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <Field label="Razón Social" id="razonSocial" error={errors.razonSocial} required>
          <Input
            id="razonSocial"
            placeholder="Ej: EMPRESA XYZ SAS"
            value={data.razonSocial}
            onChange={(e) => onChange("razonSocial", e.target.value)}
            className={errors.razonSocial ? "border-red-400 focus:ring-red-500" : ""}
          />
        </Field>
      </div>
      <Field label="Nombre Comercial" id="nombreComercial" error={errors.nombreComercial}>
        <Input
          id="nombreComercial"
          placeholder="Nombre público de la empresa"
          value={data.nombreComercial}
          onChange={(e) => onChange("nombreComercial", e.target.value)}
        />
      </Field>
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <Field label="NIT" id="nit" error={errors.nit} required>
            <Input
              id="nit"
              placeholder="900123456"
              value={data.nit}
              onChange={(e) => onChange("nit", e.target.value)}
              className={errors.nit ? "border-red-400" : ""}
            />
          </Field>
        </div>
        <Field label="DV" id="dv" error={errors.dv} required>
          <Input
            id="dv"
            placeholder="0"
            maxLength={1}
            value={data.dv}
            onChange={(e) => onChange("dv", e.target.value)}
            className={errors.dv ? "border-red-400" : ""}
          />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="Dirección" id="direccion" error={errors.direccion}>
          <Input
            id="direccion"
            placeholder="Cra 15 # 93-75 Piso 4"
            value={data.direccion}
            onChange={(e) => onChange("direccion", e.target.value)}
          />
        </Field>
      </div>
      <Field label="Ciudad" id="ciudad" error={errors.ciudad} required>
        <Input
          id="ciudad"
          placeholder="Bogotá"
          value={data.ciudad}
          onChange={(e) => onChange("ciudad", e.target.value)}
          className={errors.ciudad ? "border-red-400" : ""}
        />
      </Field>
      <Field label="Departamento" id="departamento" error={errors.departamento} required>
        <Input
          id="departamento"
          placeholder="Cundinamarca"
          value={data.departamento}
          onChange={(e) => onChange("departamento", e.target.value)}
          className={errors.departamento ? "border-red-400" : ""}
        />
      </Field>
      <Field label="Teléfono" id="telefono" error={errors.telefono}>
        <Input
          id="telefono"
          placeholder="601 320 4500"
          value={data.telefono}
          onChange={(e) => onChange("telefono", e.target.value)}
        />
      </Field>
      <Field label="Correo Electrónico" id="correo" error={errors.correo}>
        <Input
          id="correo"
          type="email"
          placeholder="contabilidad@empresa.co"
          value={data.correo}
          onChange={(e) => onChange("correo", e.target.value)}
          className={errors.correo ? "border-red-400" : ""}
        />
      </Field>
      <Field label="Estado" id="estado" error={errors.estado} required>
        <Select value={data.estado} onValueChange={(v) => onChange("estado", v)}>
          <SelectTrigger id="estado" className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVA">Activa</SelectItem>
            <SelectItem value="INACTIVA">Inactiva</SelectItem>
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}

function Step2({
  data,
  errors,
  onChange,
}: {
  data: FormData;
  errors: Errors;
  onChange: (key: keyof FormData, value: string | boolean) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2 p-4 bg-purple-50 rounded-xl border border-purple-100">
        <p className="text-xs font-medium text-purple-700">
          Ingrese los datos del representante legal que firmará y radicará las
          declaraciones ante la DIAN.
        </p>
      </div>
      <div className="sm:col-span-2">
        <Field label="Nombre Completo" id="repNombre" error={errors.repNombre} required>
          <Input
            id="repNombre"
            placeholder="Carlos Ramírez Mora"
            value={data.repNombre}
            onChange={(e) => onChange("repNombre", e.target.value)}
            className={errors.repNombre ? "border-red-400" : ""}
          />
        </Field>
      </div>
      <Field label="Número de Cédula" id="repCedula" error={errors.repCedula} required>
        <Input
          id="repCedula"
          placeholder="79.845.321"
          value={data.repCedula}
          onChange={(e) => onChange("repCedula", e.target.value)}
          className={errors.repCedula ? "border-red-400" : ""}
        />
      </Field>
      <Field label="Correo Electrónico" id="repCorreo" error={errors.repCorreo}>
        <Input
          id="repCorreo"
          type="email"
          placeholder="representante@empresa.co"
          value={data.repCorreo}
          onChange={(e) => onChange("repCorreo", e.target.value)}
        />
      </Field>
      <Field label="Teléfono Directo" id="repTelefono" error={errors.repTelefono}>
        <Input
          id="repTelefono"
          placeholder="310 550 4400"
          value={data.repTelefono}
          onChange={(e) => onChange("repTelefono", e.target.value)}
        />
      </Field>
    </div>
  );
}

function Step3({
  data,
  errors,
  onChange,
}: {
  data: FormData;
  errors: Errors;
  onChange: (key: keyof FormData, value: string | boolean) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Régimen Tributario" id="regimen" error={errors.regimen} required>
        <Select value={data.regimen} onValueChange={(v) => onChange("regimen", v)}>
          <SelectTrigger id="regimen" className={`h-9 ${errors.regimen ? "border-red-400" : ""}`}>
            <SelectValue placeholder="Seleccionar régimen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ordinario">Régimen Ordinario</SelectItem>
            <SelectItem value="simple">Régimen Simple (SIMPLE)</SelectItem>
            <SelectItem value="gran_contribuyente">Gran Contribuyente</SelectItem>
            <SelectItem value="especial">Régimen Especial</SelectItem>
            <SelectItem value="no_contribuyente">No Contribuyente</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field label="Tipo de Contribuyente" id="tipoContribuyente" error={errors.tipoContribuyente} required>
        <Select
          value={data.tipoContribuyente}
          onValueChange={(v) => onChange("tipoContribuyente", v)}
        >
          <SelectTrigger id="tipoContribuyente" className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Persona Jurídica">Persona Jurídica</SelectItem>
            <SelectItem value="Persona Natural">Persona Natural</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field label="Responsabilidad IVA" id="responsabilidadIVA" error={errors.responsabilidadIVA}>
        <Select
          value={data.responsabilidadIVA}
          onValueChange={(v) => onChange("responsabilidadIVA", v)}
        >
          <SelectTrigger id="responsabilidadIVA" className="h-9">
            <SelectValue placeholder="Seleccionar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="responsable">Responsable del IVA</SelectItem>
            <SelectItem value="no_responsable">No Responsable del IVA</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <div className="sm:col-span-2">
        <Field
          label="Actividad Económica (CIIU)"
          id="actividadEconomica"
          error={errors.actividadEconomica}
          required
        >
          <Input
            id="actividadEconomica"
            placeholder="Ej: 7911 - Agencias de viajes"
            value={data.actividadEconomica}
            onChange={(e) => onChange("actividadEconomica", e.target.value)}
            className={errors.actividadEconomica ? "border-red-400" : ""}
          />
        </Field>
      </div>

      {/* Switches */}
      <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
        <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-colors">
          <div>
            <p className="text-sm font-semibold text-gray-800">
              Obligado a Facturar
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Habilitado para facturación electrónica DIAN
            </p>
          </div>
          <Switch
            checked={data.obligadoFacturar}
            onCheckedChange={(v) => onChange("obligadoFacturar", v)}
          />
        </div>
        <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-colors">
          <div>
            <p className="text-sm font-semibold text-gray-800">
              Agente Retenedor
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Obligado a practicar retención en la fuente
            </p>
          </div>
          <Switch
            checked={data.agenteRetenedor}
            onCheckedChange={(v) => onChange("agenteRetenedor", v)}
          />
        </div>
      </div>
    </div>
  );
}

function Step4({
  data,
  errors,
  onChange,
}: {
  data: FormData;
  errors: Errors;
  onChange: (key: keyof FormData, value: string | boolean) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2 p-4 bg-green-50 rounded-xl border border-green-100">
        <p className="text-xs font-medium text-green-700">
          Configure el software contable y la modalidad de nómina para esta
          empresa. Podrá editarlo en cualquier momento desde el perfil de la
          empresa.
        </p>
      </div>

      <Field label="Software Contable" id="softwareContable" error={errors.softwareContable}>
        <Select
          value={data.softwareContable}
          onValueChange={(v) => onChange("softwareContable", v)}
        >
          <SelectTrigger id="softwareContable" className="h-9">
            <SelectValue placeholder="Seleccionar software" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="siigo_nube">Siigo Nube</SelectItem>
            <SelectItem value="siigo_windows">Siigo Windows</SelectItem>
            <SelectItem value="helisa">Helisa</SelectItem>
            <SelectItem value="world_office">World Office</SelectItem>
            <SelectItem value="aspel">Aspel COI</SelectItem>
            <SelectItem value="sap">SAP Business One</SelectItem>
            <SelectItem value="contapyme">ContaPyme</SelectItem>
            <SelectItem value="otro">Otro</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field label="Tipo de Nómina" id="tipoNomina" error={errors.tipoNomina}>
        <Select
          value={data.tipoNomina}
          onValueChange={(v) => onChange("tipoNomina", v)}
        >
          <SelectTrigger id="tipoNomina" className="h-9">
            <SelectValue placeholder="Seleccionar tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="electronica_dian">Nómina Electrónica DIAN</SelectItem>
            <SelectItem value="manual">Nómina Manual</SelectItem>
            <SelectItem value="no_aplica">No Aplica</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field label="Periodicidad de Nómina" id="periodicidadNomina" error={errors.periodicidadNomina}>
        <Select
          value={data.periodicidadNomina}
          onValueChange={(v) => onChange("periodicidadNomina", v)}
        >
          <SelectTrigger id="periodicidadNomina" className="h-9">
            <SelectValue placeholder="Seleccionar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semanal">Semanal</SelectItem>
            <SelectItem value="quincenal">Quincenal</SelectItem>
            <SelectItem value="mensual">Mensual</SelectItem>
            <SelectItem value="no_aplica">No Aplica</SelectItem>
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}

// ── Main Modal ─────────────────────────────────────────────────────────────────

interface EmpresaFormModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: Partial<FormData>;
  mode?: "create" | "edit";
}

export default function EmpresaFormModal({
  open,
  onClose,
  initialData,
  mode = "create",
}: EmpresaFormModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    ...INITIAL_FORM,
    ...initialData,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [saved, setSaved] = useState(false);

  const currentStep = STEPS[step - 1];

  function handleChange(key: keyof FormData, value: string | boolean) {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function handleNext() {
    const stepErrors = validateStep(step, formData);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setStep((s) => s + 1);
  }

  function handleBack() {
    setErrors({});
    setStep((s) => s - 1);
  }

  function handleSave() {
    const stepErrors = validateStep(step, formData);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    // Here you'd call an API / server action
    console.log("Saving empresa:", formData);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      handleClose();
    }, 1200);
  }

  function handleClose() {
    setStep(1);
    setFormData({ ...INITIAL_FORM, ...initialData });
    setErrors({});
    setSaved(false);
    onClose();
  }

  const isLastStep = step === STEPS.length;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0">
        {/* Modal header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 shrink-0">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              {mode === "edit" ? "Editar Empresa" : "Nueva Empresa"}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 mt-1">
              {mode === "edit"
                ? "Actualice los datos de la empresa"
                : "Complete los campos para registrar una nueva empresa en ContaFlow"}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Step progress */}
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <StepProgress current={step} />
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-gray-400">
              Paso {step} de {STEPS.length}
            </span>
            <span className="text-xs text-gray-300">·</span>
            <span className="text-xs font-semibold text-blue-600">
              {currentStep.label}
            </span>
            <span className="text-xs text-gray-400">
              — {currentStep.description}
            </span>
          </div>
        </div>

        {/* Form content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 1 && (
            <Step1 data={formData} errors={errors} onChange={handleChange} />
          )}
          {step === 2 && (
            <Step2 data={formData} errors={errors} onChange={handleChange} />
          )}
          {step === 3 && (
            <Step3 data={formData} errors={errors} onChange={handleChange} />
          )}
          {step === 4 && (
            <Step4 data={formData} errors={errors} onChange={handleChange} />
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-gray-100 bg-white flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            className="text-sm text-gray-600"
          >
            Cancelar
          </Button>

          <div className="flex items-center gap-2">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="gap-1.5 text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>
            )}

            {!isLastStep ? (
              <Button
                onClick={handleNext}
                className="gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={saved}
                className={`gap-1.5 text-sm min-w-[100px] transition-all ${
                  saved
                    ? "bg-green-600 hover:bg-green-600 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {saved ? (
                  <>
                    <Check className="w-4 h-4" />
                    Guardado
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {mode === "edit" ? "Actualizar" : "Guardar Empresa"}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
