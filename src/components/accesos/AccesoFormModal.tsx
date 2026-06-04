"use client";

import { useState, KeyboardEvent } from "react";
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
import { Eye, EyeOff, X, Plus } from "lucide-react";
import { EMPRESAS_MOCK } from "@/lib/empresas-mock";

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
  plataformaParafiscal: string;
  usuario: string;
  contrasena: string;
  confirmarContrasena: string;
  correoAsociado: string;
  preguntasSeguridad: string;
  tokenAdicional: string;
  observaciones: string;
  tags: string[];
  // DIAN-specific
  nitTercero: string;
  tipoDocumento: string;
}

interface AccesoFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: AccesoFormData) => void;
  initialData?: Partial<AccesoFormData>;
  mode?: "create" | "edit";
}

const EMPRESAS = EMPRESAS_MOCK.map((e) => e.razonSocial).sort();

const TIPOS_ACCESO: { value: TipoAcceso; label: string }[] = [
  { value: "DIAN",             label: "DIAN" },
  { value: "HACIENDA_BOGOTA",  label: "Secretaría de Hacienda Bogotá" },
  { value: "HACIENDA_CALI",    label: "Secretaría de Hacienda Cali" },
  { value: "PARAFISCAL",       label: "Parafiscales" },
  { value: "CAMARA",           label: "Cámara de Comercio" },
  { value: "SUPERSOCIEDADES",  label: "Supersociedades" },
  { value: "SOFTWARE_CONTABLE", label: "Software Contable" },
  { value: "OTRO",             label: "Otro" },
];

const PLATAFORMAS_PARAFISCAL = ["MiPlanilla", "Aportes en Línea", "SOI", "Arus", "Otra"];

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

const DEFAULT_FORM: AccesoFormData = {
  empresa: "",
  tipo: "",
  plataforma: "",
  plataformaParafiscal: "",
  usuario: "",
  contrasena: "",
  confirmarContrasena: "",
  correoAsociado: "",
  preguntasSeguridad: "",
  tokenAdicional: "",
  observaciones: "",
  tags: [],
  nitTercero: "",
  tipoDocumento: "",
};

export default function AccesoFormModal({
  open,
  onClose,
  onSave,
  initialData,
  mode = "create",
}: AccesoFormModalProps) {
  const [form, setForm] = useState<AccesoFormData>({
    ...DEFAULT_FORM,
    ...initialData,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof AccesoFormData, string>>>({});

  const set = (field: keyof AccesoFormData, value: string | string[]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const AUTO_PLATAFORMA: Partial<Record<TipoAcceso, string>> = {
    DIAN: "DIAN - Muisca",
    HACIENDA_BOGOTA: "Secretaría de Hacienda Bogotá",
    HACIENDA_CALI: "Secretaría de Hacienda Cali",
  };

  const handleTipoChange = (v: string) => {
    const tipo = v as TipoAcceso;
    setForm((prev) => ({
      ...prev,
      tipo,
      plataforma: AUTO_PLATAFORMA[tipo] ?? prev.plataforma,
    }));
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !form.tags.includes(trimmed)) {
      set("tags", [...form.tags, trimmed]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) =>
    set("tags", form.tags.filter((t) => t !== tag));

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof AccesoFormData, string>> = {};
    if (!form.empresa) newErrors.empresa = "Seleccione una empresa";
    if (!form.tipo) newErrors.tipo = "Seleccione el tipo de acceso";
    if (!form.contrasena) newErrors.contrasena = "Ingrese la contraseña";
    if (form.contrasena && form.confirmarContrasena && form.contrasena !== form.confirmarContrasena) {
      newErrors.confirmarContrasena = "Las contraseñas no coinciden";
    }
    if (form.tipo === "DIAN") {
      if (!form.tipoDocumento) newErrors.tipoDocumento = "Seleccione el tipo de documento";
      if (!form.usuario) newErrors.usuario = "Ingrese el número de documento";
    } else {
      if (!form.plataforma) newErrors.plataforma = "Ingrese el nombre de la plataforma";
      if (!form.usuario) newErrors.usuario = "Ingrese el usuario";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

  const isDian = form.tipo === "DIAN" || form.tipo === "HACIENDA_BOGOTA" || form.tipo === "HACIENDA_CALI";

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
                {EMPRESAS.map((e) => (
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

          {/* ══════════ DIAN-specific fields ══════════ */}
          {isDian && (
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
            </>
          )}

          {/* ══════════ Generic fields (non-DIAN) ══════════ */}
          {!isDian && (
            <>
              {/* Plataforma */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">
                  Plataforma / Nombre <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={form.plataforma}
                  onChange={(e) => set("plataforma", e.target.value)}
                  placeholder="Ej: Siigo, MiPlanilla..."
                  className={errors.plataforma ? "border-red-400" : ""}
                />
                {errors.plataforma && <p className="text-xs text-red-500">{errors.plataforma}</p>}
              </div>

              {/* Plataforma Parafiscal */}
              {form.tipo === "PARAFISCAL" && (
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">Plataforma Parafiscal</Label>
                  <Select
                    value={form.plataformaParafiscal}
                    onValueChange={(v) => set("plataformaParafiscal", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar plataforma..." />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATAFORMAS_PARAFISCAL.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

              {/* Correo Asociado */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">
                  Correo Asociado <span className="text-gray-400 font-normal">(opcional)</span>
                </Label>
                <Input
                  type="email"
                  value={form.correoAsociado}
                  onChange={(e) => set("correoAsociado", e.target.value)}
                  placeholder="correo@empresa.com"
                />
              </div>
            </>
          )}

          {/* ── Contraseña ── */}
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
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.contrasena && <p className="text-xs text-red-500">{errors.contrasena}</p>}
          </div>

          {/* ── Confirmar Contraseña ── */}
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
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmarContrasena && (
              <p className="text-xs text-red-500">{errors.confirmarContrasena}</p>
            )}
          </div>

          {/* ── Token (solo para tipos no-DIAN) ── */}
          {!isDian && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">
                Token / Código adicional <span className="text-gray-400 font-normal">(opcional)</span>
              </Label>
              <Input
                value={form.tokenAdicional}
                onChange={(e) => set("tokenAdicional", e.target.value)}
                placeholder="Token, PIN, código de seguridad..."
              />
            </div>
          )}

          {/* ── Observaciones ── */}
          <div className={`space-y-1.5 ${isDian ? "md:col-span-2" : ""}`}>
            <Label className="text-sm font-medium text-gray-700">Observaciones</Label>
            <Textarea
              value={form.observaciones}
              onChange={(e) => set("observaciones", e.target.value)}
              placeholder="Notas adicionales, instrucciones especiales..."
              rows={2}
              className="resize-none"
            />
          </div>

          {/* ── Preguntas de seguridad (solo no-DIAN) ── */}
          {!isDian && (
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-sm font-medium text-gray-700">
                Preguntas de Seguridad <span className="text-gray-400 font-normal">(opcional)</span>
              </Label>
              <Textarea
                value={form.preguntasSeguridad}
                onChange={(e) => set("preguntasSeguridad", e.target.value)}
                placeholder="Pregunta: ¿Cuál es el nombre de su primera mascota? Respuesta: Fido"
                rows={2}
                className="resize-none"
              />
            </div>
          )}

          {/* ── Etiquetas ── */}
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-sm font-medium text-gray-700">Etiquetas</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Agregar etiqueta y presionar Enter..."
                className="flex-1"
              />
              <Button type="button" variant="outline" size="sm" onClick={addTag}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-blue-900 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
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
