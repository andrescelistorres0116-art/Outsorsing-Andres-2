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
  | "HACIENDA"
  | "PARAFISCAL"
  | "BANCO"
  | "CAMARA"
  | "UGPP"
  | "SUPERSOCIEDADES"
  | "SOFTWARE_CONTABLE"
  | "FACTURACION"
  | "FIRMA_DIGITAL"
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
  banco: string;
  municipio: string;
  preguntasSeguridad: string;
  tokenAdicional: string;
  observaciones: string;
  tags: string[];
  logoUrl: string;
  colorKey: string;
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
  { value: "DIAN", label: "DIAN" },
  { value: "HACIENDA", label: "Secretaría de Hacienda" },
  { value: "PARAFISCAL", label: "Parafiscales" },
  { value: "BANCO", label: "Banco" },
  { value: "CAMARA", label: "Cámara de Comercio" },
  { value: "UGPP", label: "UGPP" },
  { value: "SUPERSOCIEDADES", label: "Supersociedades" },
  { value: "SOFTWARE_CONTABLE", label: "Software Contable" },
  { value: "FACTURACION", label: "Facturación Electrónica" },
  { value: "FIRMA_DIGITAL", label: "Firma Digital" },
  { value: "OTRO", label: "Otro" },
];

const PLATAFORMAS_PARAFISCAL = [
  "MiPlanilla",
  "Aportes en Línea",
  "SOI",
  "Arus",
  "Otra",
];

export const COLOR_PALETTE: { key: string; hex: string; label: string }[] = [
  { key: "red",    hex: "#DC2626", label: "Rojo" },
  { key: "orange", hex: "#EA580C", label: "Naranja" },
  { key: "amber",  hex: "#D97706", label: "Ámbar" },
  { key: "green",  hex: "#16A34A", label: "Verde" },
  { key: "teal",   hex: "#0D9488", label: "Teal" },
  { key: "cyan",   hex: "#0891B2", label: "Cyan" },
  { key: "blue",   hex: "#2563EB", label: "Azul" },
  { key: "indigo", hex: "#4F46E5", label: "Índigo" },
  { key: "purple", hex: "#9333EA", label: "Morado" },
  { key: "pink",   hex: "#EC4899", label: "Rosa" },
  { key: "rose",   hex: "#E11D48", label: "Fucsia" },
  { key: "gray",   hex: "#6B7280", label: "Gris" },
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
  banco: "",
  municipio: "",
  preguntasSeguridad: "",
  tokenAdicional: "",
  observaciones: "",
  tags: [],
  logoUrl: "",
  colorKey: "",
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
    if (!form.plataforma) newErrors.plataforma = "Ingrese el nombre de la plataforma";
    if (!form.usuario) newErrors.usuario = "Ingrese el usuario";
    if (!form.contrasena) newErrors.contrasena = "Ingrese la contraseña";
    if (form.contrasena && form.confirmarContrasena && form.contrasena !== form.confirmarContrasena) {
      newErrors.confirmarContrasena = "Las contraseñas no coinciden";
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

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">
            {mode === "create" ? "Agregar Acceso" : "Editar Acceso"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
          {/* Empresa */}
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

          {/* Tipo de Acceso */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              Tipo de Acceso <span className="text-red-500">*</span>
            </Label>
            <Select value={form.tipo} onValueChange={(v) => set("tipo", v as TipoAcceso)}>
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

          {/* Plataforma / Nombre */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              Plataforma / Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              value={form.plataforma}
              onChange={(e) => set("plataforma", e.target.value)}
              placeholder="Ej: Siigo, Banco Bogotá, MiPlanilla..."
              className={errors.plataforma ? "border-red-400" : ""}
            />
            {errors.plataforma && <p className="text-xs text-red-500">{errors.plataforma}</p>}
          </div>

          {/* Plataforma Parafiscal (condicional) */}
          {form.tipo === "PARAFISCAL" && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">
                Plataforma Parafiscal
              </Label>
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

          {/* Banco (condicional) */}
          {form.tipo === "BANCO" && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Banco</Label>
              <Input
                value={form.banco}
                onChange={(e) => set("banco", e.target.value)}
                placeholder="Ej: Banco de Bogotá, Davivienda..."
              />
            </div>
          )}

          {/* Municipio (condicional) */}
          {form.tipo === "HACIENDA" && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Municipio</Label>
              <Input
                value={form.municipio}
                onChange={(e) => set("municipio", e.target.value)}
                placeholder="Ej: Bogotá, Medellín..."
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

          {/* Confirmar Contraseña */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              Confirmar Contraseña
            </Label>
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

          {/* Token/Código adicional */}
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

          {/* Preguntas de Seguridad */}
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

          {/* Tags */}
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

          {/* Apariencia */}
          <div className="space-y-3 md:col-span-2 border-t pt-3">
            <Label className="text-sm font-medium text-gray-700">
              Apariencia <span className="text-gray-400 font-normal">(opcional)</span>
            </Label>

            {/* Color de la tarjeta */}
            <div className="space-y-1.5">
              <p className="text-xs text-gray-500">Color de la tarjeta</p>
              <div className="flex flex-wrap gap-2 items-center">
                <button
                  type="button"
                  onClick={() => set("colorKey", "")}
                  className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center bg-white ${
                    !form.colorKey
                      ? "border-gray-700 shadow-sm"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                  title="Automático (según tipo)"
                >
                  <span className="text-xs text-gray-400 font-bold">A</span>
                </button>
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => set("colorKey", c.key)}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${
                      form.colorKey === c.key
                        ? "border-gray-700 shadow-sm scale-110"
                        : "border-transparent hover:border-gray-400"
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* Logo URL */}
            <div className="space-y-1.5">
              <p className="text-xs text-gray-500">Logo de la plataforma (URL de imagen)</p>
              <div className="flex items-center gap-2">
                {form.logoUrl && (
                  <div className="w-9 h-9 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                    <img
                      src={form.logoUrl}
                      alt="preview"
                      className="w-7 h-7 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
                <Input
                  value={form.logoUrl}
                  onChange={(e) => set("logoUrl", e.target.value)}
                  placeholder="https://... (pega el enlace del logo)"
                  className="flex-1 text-xs"
                />
                {form.logoUrl && (
                  <button
                    type="button"
                    onClick={() => set("logoUrl", "")}
                    className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                    title="Quitar logo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
            {mode === "create" ? "Guardar Acceso" : "Actualizar Acceso"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
