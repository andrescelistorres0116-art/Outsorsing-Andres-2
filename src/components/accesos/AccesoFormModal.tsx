"use client";

import { useState, useEffect } from "react";
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
import { Eye, EyeOff } from "lucide-react";

export type TipoAcceso =
  | "DIAN"
  | "HACIENDA_BOGOTA"
  | "HACIENDA_CALI"
  | "PARAFISCAL"
  | "CAMARA"
  | "SUPERSOCIEDADES"
  | "SOFTWARE_CONTABLE"
  | "OTRO";

export interface AccesoFormData {
  empresa: string;
  tipo: TipoAcceso | "";
  plataforma: string;
  usuario: string;
  contrasena: string;
  confirmarContrasena: string;
  observaciones: string;
  tags: string[];
  // NIT fields
  nitEmpresa: string;
  nombreSoftware: string;
  nitTercero: string;
  // DIAN / Hacienda specific
  tipoDocumento: string;
  // legacy (kept for backwards compat with existing stored data)
  correoAsociado: string;
  preguntasSeguridad: string;
  tokenAdicional: string;
  plataformaParafiscal: string;
}

interface AccesoFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: AccesoFormData) => void;
  initialData?: Partial<AccesoFormData>;
  mode?: "create" | "edit";
  empresas: string[];
}

const TIPOS_ACCESO: { value: TipoAcceso; label: string }[] = [
  { value: "DIAN",              label: "DIAN" },
  { value: "HACIENDA_BOGOTA",   label: "Secretaría de Hacienda Bogotá" },
  { value: "HACIENDA_CALI",     label: "Secretaría de Hacienda Cali" },
  { value: "PARAFISCAL",        label: "Parafiscales" },
  { value: "CAMARA",            label: "Cámara de Comercio" },
  { value: "SUPERSOCIEDADES",   label: "Supersociedades" },
  { value: "SOFTWARE_CONTABLE", label: "Software Contable" },
  { value: "OTRO",              label: "Otro" },
];

const TIPOS_DOCUMENTO = [
  "Tarjeta de identidad",
  "Registro civil de nacimiento",
  "Cédula de ciudadanía",
  "Certificado registraduría sin identificación",
  "Tarjeta de extranjería",
  "Cédula de extranjería",
  "Pasaporte",
  "Documento de identificación extranjero",
  "Sin identificación del exterior o para uso definido DIAN",
  "Documento de identificación extranjero persona jurídica",
  "Carné diplomático",
  "Permiso especial de permanencia PEP",
  "Permiso de protección temporal PPT",
];

const AUTO_PLATAFORMA: Partial<Record<TipoAcceso, string>> = {
  DIAN: "DIAN - Muisca",
  HACIENDA_BOGOTA: "Secretaría de Hacienda Bogotá",
  HACIENDA_CALI: "Secretaría de Hacienda Cali",
};

const DEFAULT_FORM: AccesoFormData = {
  empresa: "",
  tipo: "",
  plataforma: "",
  usuario: "",
  contrasena: "",
  confirmarContrasena: "",
  observaciones: "",
  tags: [],
  nitEmpresa: "",
  nombreSoftware: "",
  nitTercero: "",
  tipoDocumento: "",
  correoAsociado: "",
  preguntasSeguridad: "",
  tokenAdicional: "",
  plataformaParafiscal: "",
};

export default function AccesoFormModal({
  open,
  onClose,
  onSave,
  initialData,
  mode = "create",
  empresas,
}: AccesoFormModalProps) {
  const [form, setForm] = useState<AccesoFormData>({
    ...DEFAULT_FORM,
    ...initialData,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof AccesoFormData, string>>>({});

  // Sync form with initialData every time the modal opens
  useEffect(() => {
    if (open) {
      setForm({ ...DEFAULT_FORM, ...initialData });
      setErrors({});
      setShowPassword(false);
      setShowConfirm(false);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (field: keyof AccesoFormData, value: string | string[]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleTipoChange = (v: string) => {
    const tipo = v as TipoAcceso;
    setForm((prev) => ({
      ...prev,
      tipo,
      plataforma: AUTO_PLATAFORMA[tipo] ?? prev.plataforma,
    }));
  };

  // DIAN and Hacienda share the same form layout
  const isDianLayout = form.tipo === "DIAN" || form.tipo === "HACIENDA_BOGOTA" || form.tipo === "HACIENDA_CALI";

  const validate = (): boolean => {
    const e: Partial<Record<keyof AccesoFormData, string>> = {};
    if (!form.empresa) e.empresa = "Seleccione una empresa";
    if (!form.tipo) e.tipo = "Seleccione el tipo de acceso";
    if (!form.contrasena) e.contrasena = "Ingrese la contraseña";
    if (isDianLayout) {
      if (!form.tipoDocumento) e.tipoDocumento = "Seleccione el tipo de documento";
      if (!form.usuario) e.usuario = "Ingrese el número de documento";
      if (form.contrasena && form.confirmarContrasena && form.contrasena !== form.confirmarContrasena)
        e.confirmarContrasena = "Las contraseñas no coinciden";
    } else {
      if (!form.usuario) e.usuario = "Ingrese el usuario";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave(form);
    setForm(DEFAULT_FORM);
    setErrors({});
  };

  const handleClose = () => {
    setForm(DEFAULT_FORM);
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">
            {mode === "create" ? "Agregar Acceso" : "Editar Acceso"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">

          {/* ── Empresa ── */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              Empresa <span className="text-red-500">*</span>
            </Label>
            <Select value={form.empresa} onValueChange={(v) => set("empresa", v)}>
              <SelectTrigger className={errors.empresa ? "border-red-400" : ""}>
                <SelectValue placeholder="Seleccionar empresa..." />
              </SelectTrigger>
              <SelectContent>
                {empresas.map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.empresa && <p className="text-xs text-red-500">{errors.empresa}</p>}
          </div>

          {/* ── Tipo de Acceso ── */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              Tipo de Acceso <span className="text-red-500">*</span>
            </Label>
            <Select value={form.tipo} onValueChange={handleTipoChange}>
              <SelectTrigger className={errors.tipo ? "border-red-400" : ""}>
                <SelectValue placeholder="Seleccionar tipo..." />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_ACCESO.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.tipo && <p className="text-xs text-red-500">{errors.tipo}</p>}
          </div>

          {/* ══════════ DIAN / HACIENDA fields ══════════ */}
          {isDianLayout && (
            <>
              {/* NIT del tercero */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">
                  NIT del tercero <span className="text-gray-400 font-normal">(opcional)</span>
                </Label>
                <Input
                  value={form.nitTercero}
                  onChange={(e) => set("nitTercero", e.target.value)}
                  placeholder="Ej: 900123456-7"
                />
              </div>

              {/* Tipo de documento */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">
                  Tipo de documento <span className="text-red-500">*</span>
                </Label>
                <Select value={form.tipoDocumento} onValueChange={(v) => set("tipoDocumento", v)}>
                  <SelectTrigger className={errors.tipoDocumento ? "border-red-400" : ""}>
                    <SelectValue placeholder="Seleccionar tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_DOCUMENTO.map((td) => (
                      <SelectItem key={td} value={td}>{td}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.tipoDocumento && <p className="text-xs text-red-500">{errors.tipoDocumento}</p>}
              </div>

              {/* Número de documento */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">
                  Número de documento <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={form.usuario}
                  onChange={(e) => set("usuario", e.target.value)}
                  placeholder="Número de documento..."
                  className={errors.usuario ? "border-red-400" : ""}
                />
                {errors.usuario && <p className="text-xs text-red-500">{errors.usuario}</p>}
              </div>

              {/* Contraseña */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">
                  Contraseña <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={form.contrasena}
                    onChange={(e) => set("contrasena", e.target.value)}
                    placeholder="Contraseña..."
                    className={`pr-10 ${errors.contrasena ? "border-red-400" : ""}`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.contrasena && <p className="text-xs text-red-500">{errors.contrasena}</p>}
              </div>

              {/* Confirmar Contraseña */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Confirmar Contraseña</Label>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    value={form.confirmarContrasena}
                    onChange={(e) => set("confirmarContrasena", e.target.value)}
                    placeholder="Repetir contraseña..."
                    className={`pr-10 ${errors.confirmarContrasena ? "border-red-400" : ""}`}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmarContrasena && <p className="text-xs text-red-500">{errors.confirmarContrasena}</p>}
              </div>

              {/* Observaciones */}
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-sm font-medium text-gray-700">Observaciones</Label>
                <Textarea
                  value={form.observaciones}
                  onChange={(e) => set("observaciones", e.target.value)}
                  placeholder="Notas adicionales, instrucciones especiales..."
                  rows={2}
                  className="resize-none"
                />
              </div>
            </>
          )}

          {/* ══════════ Generic fields ══════════ */}
          {!isDianLayout && form.tipo !== "" && (
            <>
              {/* NIT empresa */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">
                  NIT empresa <span className="text-gray-400 font-normal">(opcional)</span>
                </Label>
                <Input
                  value={form.nitEmpresa}
                  onChange={(e) => set("nitEmpresa", e.target.value)}
                  placeholder="Ej: 900123456-7"
                />
              </div>

              {/* Nombre del software (solo SOFTWARE_CONTABLE) */}
              {form.tipo === "SOFTWARE_CONTABLE" && (
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">
                    Nombre del software <span className="text-gray-400 font-normal">(opcional)</span>
                  </Label>
                  <Input
                    value={form.nombreSoftware}
                    onChange={(e) => set("nombreSoftware", e.target.value)}
                    placeholder="Ej: Siigo, World Office, Helisa..."
                  />
                </div>
              )}

              {/* Usuario */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">
                  Usuario <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={form.usuario}
                  onChange={(e) => set("usuario", e.target.value)}
                  placeholder="Usuario o NIT..."
                  className={errors.usuario ? "border-red-400" : ""}
                />
                {errors.usuario && <p className="text-xs text-red-500">{errors.usuario}</p>}
              </div>

              {/* Contraseña */}
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-sm font-medium text-gray-700">
                  Contraseña <span className="text-red-500">*</span>
                </Label>
                <div className="relative max-w-sm">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={form.contrasena}
                    onChange={(e) => set("contrasena", e.target.value)}
                    placeholder="Contraseña..."
                    className={`pr-10 ${errors.contrasena ? "border-red-400" : ""}`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.contrasena && <p className="text-xs text-red-500">{errors.contrasena}</p>}
              </div>

              {/* Observaciones */}
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-sm font-medium text-gray-700">Observaciones</Label>
                <Textarea
                  value={form.observaciones}
                  onChange={(e) => set("observaciones", e.target.value)}
                  placeholder="Notas adicionales, instrucciones especiales..."
                  rows={2}
                  className="resize-none"
                />
              </div>
            </>
          )}

        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
            {mode === "create" ? "Guardar Acceso" : "Actualizar Acceso"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
