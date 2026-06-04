"use client";

import { useState, useCallback, useEffect } from "react";
import {
  ShieldCheck,
  Plus,
  Search,
  Eye,
  EyeOff,
  Copy,
  Check,
  Pencil,
  KeyRound,
  Building2,
  Landmark,
  ShieldAlert,
  Briefcase,
  Globe,
  Tag,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import AccesoFormModal, { AccesoFormData, TipoAcceso } from "@/components/accesos/AccesoFormModal";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Acceso {
  id: number;
  empresa: string;
  tipo: TipoAcceso;
  plataforma: string;
  usuario: string;
  contrasena: string;
  correoAsociado?: string;
  tags: string[];
  ultimoAcceso: string;
}

// ── Mock Data ──────────────────────────────────────────────────────────────────

const ACCESOS: Acceso[] = [
  {
    id: 1,
    empresa: "X TOURS SAS",
    tipo: "DIAN",
    plataforma: "DIAN - Muisca",
    usuario: "xtours901234@gmail.com",
    contrasena: "Xtours#2024*",
    correoAsociado: "xtours901234@gmail.com",
    tags: ["principal", "declaraciones"],
    ultimoAcceso: "2026-05-28",
  },
  {
    id: 2,
    empresa: "DIAZAR LTDA",
    tipo: "DIAN",
    plataforma: "DIAN - Muisca",
    usuario: "diazar800@hotmail.com",
    contrasena: "Diazar@800!",
    correoAsociado: "diazar800@hotmail.com",
    tags: ["declaraciones", "retención"],
    ultimoAcceso: "2026-05-30",
  },
  {
    id: 3,
    empresa: "300 HILOS SAS",
    tipo: "DIAN",
    plataforma: "DIAN - Muisca",
    usuario: "contabilidad@300hilos.com",
    contrasena: "H1los#Conta24",
    correoAsociado: "contabilidad@300hilos.com",
    tags: ["IVA", "renta"],
    ultimoAcceso: "2026-06-01",
  },
  {
    id: 4,
    empresa: "DIAZAR LTDA",
    tipo: "HACIENDA_BOGOTA",
    plataforma: "Secretaría Hacienda Bogotá",
    usuario: "DIAZAR123",
    contrasena: "Hac!enda2024",
    tags: ["impuesto-industria", "bogotá"],
    ultimoAcceso: "2026-05-15",
  },
  {
    id: 5,
    empresa: "X TOURS SAS",
    tipo: "PARAFISCAL",
    plataforma: "MiPlanilla",
    usuario: "xtours_planilla",
    contrasena: "Plan!lla#X24",
    correoAsociado: "nomina@xtours.co",
    tags: ["parafiscales", "aportes"],
    ultimoAcceso: "2026-06-01",
  },
  {
    id: 6,
    empresa: "300 HILOS SAS",
    tipo: "PARAFISCAL",
    plataforma: "Aportes en Línea",
    usuario: "300hilos_apl",
    contrasena: "APL300H!los",
    correoAsociado: "rrhh@300hilos.com",
    tags: ["parafiscales"],
    ultimoAcceso: "2026-05-31",
  },
  {
    id: 9,
    empresa: "300 HILOS SAS",
    tipo: "CAMARA",
    plataforma: "Cámara de Comercio Bogotá",
    usuario: "ccb.300hilos@gmail.com",
    contrasena: "CCB300H!24",
    correoAsociado: "ccb.300hilos@gmail.com",
    tags: ["registro-mercantil"],
    ultimoAcceso: "2026-04-10",
  },
  {
    id: 10,
    empresa: "X TOURS SAS",
    tipo: "SOFTWARE_CONTABLE",
    plataforma: "Siigo",
    usuario: "xtours.siigo",
    contrasena: "S!igo#Xtours24",
    correoAsociado: "contabilidad@xtours.co",
    tags: ["contabilidad", "software"],
    ultimoAcceso: "2026-06-03",
  },
  {
    id: 11,
    empresa: "300 HILOS SAS",
    tipo: "SOFTWARE_CONTABLE",
    plataforma: "Siigo",
    usuario: "hilos.siigo",
    contrasena: "S!igo#300H24",
    correoAsociado: "info@300hilos.com",
    tags: ["contabilidad", "software"],
    ultimoAcceso: "2026-06-03",
  },
];

// ── Tipo Config — logo y color por tipo ────────────────────────────────────────

const TIPO_CONFIG: Record<
  TipoAcceso,
  {
    label: string;
    color: string;
    border: string;
    bg: string;
    badgeClass: string;
    Icon: React.ElementType;
    logoUrl: string;
  }
> = {
  DIAN: {
    label: "DIAN",
    color: "text-green-700",
    border: "border-green-400",
    bg: "bg-green-50",
    badgeClass: "bg-green-100 text-green-700 border-green-200",
    Icon: KeyRound,
    logoUrl: "https://normograma.dian.gov.co/dian/compilacion/images/LogoDian.png",
  },
  HACIENDA_BOGOTA: {
    label: "Hacienda Bogotá",
    color: "text-red-700",
    border: "border-red-400",
    bg: "bg-red-50",
    badgeClass: "bg-red-100 text-red-700 border-red-200",
    Icon: Landmark,
    logoUrl: "https://vectorseek.com/wp-content/uploads/2023/09/Bogota-Logo-Vector.svg-.png",
  },
  HACIENDA_CALI: {
    label: "Hacienda Cali",
    color: "text-blue-900",
    border: "border-blue-700",
    bg: "bg-blue-50",
    badgeClass: "bg-blue-100 text-blue-900 border-blue-300",
    Icon: Landmark,
    logoUrl: "https://datos.cali.gov.co/uploads/group/2018-11-30-210214.804606EscudosAlcaldiaSecretariasYDepartamentos-03.jpg",
  },
  PARAFISCAL: {
    label: "Parafiscal",
    color: "text-orange-700",
    border: "border-orange-400",
    bg: "bg-orange-50",
    badgeClass: "bg-orange-100 text-orange-700 border-orange-200",
    Icon: ShieldAlert,
    logoUrl: "https://www.ugpp.gov.co/wp-content/uploads/2024/11/Logo-UGPP.png",
  },
  CAMARA: {
    label: "Cámara de Comercio",
    color: "text-red-700",
    border: "border-red-400",
    bg: "bg-red-50",
    badgeClass: "bg-red-100 text-red-700 border-red-200",
    Icon: Building2,
    logoUrl: "https://images.seeklogo.com/logo-png/47/1/camara-de-comercio-de-bogota-logo-png_seeklogo-472369.png",
  },
  SUPERSOCIEDADES: {
    label: "Supersociedades",
    color: "text-stone-700",
    border: "border-stone-400",
    bg: "bg-stone-50",
    badgeClass: "bg-stone-100 text-stone-700 border-stone-200",
    Icon: Briefcase,
    logoUrl: "https://www.auditoriaygestion.co/wp-content/uploads/2015/12/supersociedades.jpg",
  },
  SOFTWARE_CONTABLE: {
    label: "Software Cont.",
    color: "text-sky-600",
    border: "border-sky-400",
    bg: "bg-sky-50",
    badgeClass: "bg-sky-100 text-sky-700 border-sky-200",
    Icon: Globe,
    logoUrl: "",
  },
  OTRO: {
    label: "Otro",
    color: "text-purple-700",
    border: "border-purple-400",
    bg: "bg-purple-50",
    badgeClass: "bg-purple-100 text-purple-700 border-purple-200",
    Icon: Globe,
    logoUrl: "",
  },
};

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${d} ${months[parseInt(m) - 1]} ${y}`;
}

// ── Credential Card ────────────────────────────────────────────────────────────

function AccesoCard({
  acceso,
  onEdit,
  onDelete,
}: {
  acceso: Acceso;
  onEdit: (a: Acceso) => void;
  onDelete: (id: number) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const cfg = TIPO_CONFIG[acceso.tipo];
  const Icon = cfg.Icon;
  const showLogo = !!cfg.logoUrl && !logoError;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(acceso.contrasena);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [acceso.contrasena]);

  return (
    <Card className={`border-l-4 ${cfg.border} hover:shadow-md transition-all duration-200 flex flex-col`}>
      <CardContent className="p-4 flex flex-col gap-3 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${cfg.bg} shrink-0 overflow-hidden`}>
              {showLogo ? (
                <img
                  src={cfg.logoUrl}
                  alt={cfg.label}
                  className="w-8 h-8 object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <Icon className={`w-5 h-5 ${cfg.color}`} />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 leading-tight truncate">
                {acceso.plataforma}
              </p>
              <p className="text-xs text-gray-400 truncate mt-0.5">{acceso.empresa}</p>
            </div>
          </div>
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold shrink-0 ${cfg.badgeClass}`}>
            {cfg.label}
          </span>
        </div>

        {/* Credentials */}
        <div className="space-y-2 bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-20 shrink-0 font-medium">Usuario:</span>
            <span className="text-xs text-gray-800 font-mono truncate flex-1">{acceso.usuario}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-20 shrink-0 font-medium">Contraseña:</span>
            <span className="text-xs text-gray-800 font-mono flex-1 truncate">
              {showPassword ? acceso.contrasena : "●●●●●●●●"}
            </span>
            <button
              onClick={() => setShowPassword((v) => !v)}
              className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors shrink-0"
              title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Tags */}
        {acceso.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {acceso.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200"
              >
                <Tag className="w-2.5 h-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="pt-1 border-t border-gray-100 mt-auto">
          {confirmDelete ? (
            <div className="flex items-center justify-between gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <span className="text-xs text-red-700 font-medium">¿Eliminar este acceso?</span>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmDelete(false)}
                  className="h-7 px-2 text-xs text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={() => onDelete(acceso.id)}
                  className="h-7 px-2 text-xs bg-red-600 hover:bg-red-700 text-white border-0"
                >
                  Sí, eliminar
                </Button>
              </div>
            </div>
          ) : (
          <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Último acceso: {formatDate(acceso.ultimoAcceso)}
          </span>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(acceso)}
              className="h-7 px-2 text-xs gap-1 text-gray-500 hover:text-blue-600 hover:border-blue-300"
            >
              <Pencil className="w-3 h-3" />
              Editar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className={`h-7 px-2 text-xs gap-1 transition-all ${
                copied
                  ? "border-green-400 text-green-600 bg-green-50"
                  : "text-gray-500 hover:text-blue-600 hover:border-blue-300"
              }`}
              title="Copiar contraseña"
            >
              {copied ? (
                <><Check className="w-3 h-3" />Copiado!</>
              ) : (
                <><Copy className="w-3 h-3" />Copiar</>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirmDelete(true)}
              className="h-7 px-2 text-xs gap-1 text-gray-500 hover:text-red-600 hover:border-red-300 hover:bg-red-50"
              title="Eliminar acceso"
            >
              <Trash2 className="w-3 h-3" />
              Eliminar
            </Button>
          </div>
          </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AccesosPage() {
  const [accesos, setAccesos] = useState<Acceso[]>(ACCESOS);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [empresaFilter, setEmpresaFilter] = useState("todas");
  const [tipoFilter, setTipoFilter] = useState("todos");

  // Load from server on mount
  useEffect(() => {
    fetch("/api/app-accesos")
      .then((r) => r.json())
      .then((data: Acceso[]) => {
        if (Array.isArray(data)) setAccesos(data);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // Sync to server on every change (after initial load)
  useEffect(() => {
    if (!loaded) return;
    fetch("/api/app-accesos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(accesos),
    }).catch(() => {});
  }, [accesos, loaded]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<Partial<AccesoFormData> | undefined>();
  const [editMode, setEditMode] = useState<"create" | "edit">("create");
  const [editId, setEditId] = useState<number | null>(null);

  const empresas = Array.from(new Set(accesos.map((a) => a.empresa))).sort();

  const filtered = accesos.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch =
      a.plataforma.toLowerCase().includes(q) ||
      a.empresa.toLowerCase().includes(q) ||
      a.usuario.toLowerCase().includes(q) ||
      a.tags.some((t) => t.toLowerCase().includes(q));
    const matchEmpresa = empresaFilter === "todas" || a.empresa === empresaFilter;
    const matchTipo = tipoFilter === "todos" || a.tipo === tipoFilter;
    return matchSearch && matchEmpresa && matchTipo;
  });

  const handleOpenCreate = () => {
    setEditData(undefined);
    setEditMode("create");
    setEditId(null);
    setModalOpen(true);
  };

  const handleEdit = (a: Acceso) => {
    setEditData({
      empresa: a.empresa,
      tipo: a.tipo,
      plataforma: a.plataforma,
      usuario: a.usuario,
      contrasena: a.contrasena,
      confirmarContrasena: a.contrasena,
      correoAsociado: a.correoAsociado ?? "",
      tags: a.tags,
    });
    setEditMode("edit");
    setEditId(a.id);
    setModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setAccesos((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSave = (data: AccesoFormData) => {
    if (editMode === "create") {
      const newAcceso: Acceso = {
        id: Date.now(),
        empresa: data.empresa,
        tipo: data.tipo as TipoAcceso,
        plataforma: data.plataforma,
        usuario: data.usuario,
        contrasena: data.contrasena,
        correoAsociado: data.correoAsociado || undefined,
        tags: data.tags,
        ultimoAcceso: new Date().toISOString().split("T")[0],
      };
      setAccesos((prev) => [newAcceso, ...prev]);
    } else if (editId !== null) {
      setAccesos((prev) =>
        prev.map((a) =>
          a.id === editId
            ? {
                ...a,
                empresa: data.empresa,
                tipo: data.tipo as TipoAcceso,
                plataforma: data.plataforma,
                usuario: data.usuario,
                contrasena: data.contrasena,
                correoAsociado: data.correoAsociado || undefined,
                tags: data.tags,
              }
            : a
        )
      );
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 shadow-lg shadow-blue-600/25">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Directorio de Accesos</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Bóveda segura de credenciales para todas las plataformas
            </p>
          </div>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Agregar Acceso
        </Button>
      </div>

      {/* Security Banner */}
      <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
        <p className="text-sm text-blue-700">
          <span className="font-semibold">Acceso seguro:</span> Las contraseñas están cifradas.
          Solo usuarios autorizados pueden ver las contraseñas.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Accesos", value: accesos.length, color: "text-gray-900", bg: "bg-white" },
          {
            label: "DIAN",
            value: accesos.filter((a) => a.tipo === "DIAN").length,
            color: "text-green-700",
            bg: "bg-green-50",
          },
          {
            label: "Hacienda",
            value: accesos.filter((a) => a.tipo === "HACIENDA_BOGOTA" || a.tipo === "HACIENDA_CALI").length,
            color: "text-red-700",
            bg: "bg-red-50",
          },
          {
            label: "Parafiscales",
            value: accesos.filter((a) => a.tipo === "PARAFISCAL").length,
            color: "text-orange-700",
            bg: "bg-orange-50",
          },
        ].map((s) => (
          <Card key={s.label} className={`${s.bg} border`}>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-500">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar plataforma, empresa, usuario..."
                className="pl-9 h-9 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <SearchableSelect
              value={empresaFilter}
              onValueChange={setEmpresaFilter}
              placeholder="Empresa"
              searchPlaceholder="Buscar empresa..."
              className="w-44"
              options={[
                { value: "todas", label: "Todas las empresas" },
                ...empresas.map((e) => ({ value: e, label: e })),
              ]}
            />

            <SearchableSelect
              value={tipoFilter}
              onValueChange={setTipoFilter}
              placeholder="Tipo"
              searchPlaceholder="Buscar tipo..."
              className="w-48"
              options={[
                { value: "todos",            label: "Todos los tipos" },
                { value: "DIAN",             label: "DIAN" },
                { value: "HACIENDA_BOGOTA",  label: "Hacienda Bogotá" },
                { value: "HACIENDA_CALI",    label: "Hacienda Cali" },
                { value: "PARAFISCAL",       label: "Parafiscal" },
                { value: "CAMARA",           label: "Cámara de Comercio" },
                { value: "SUPERSOCIEDADES",  label: "Supersociedades" },
                { value: "SOFTWARE_CONTABLE", label: "Software Contable" },
                { value: "OTRO",             label: "Otro" },
              ]}
            />

            <div className="flex-1 hidden sm:block" />

            <p className="text-sm text-gray-500 shrink-0">
              <span className="font-semibold text-gray-900">{filtered.length}</span> acceso
              {filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <KeyRound className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No se encontraron accesos</p>
          <p className="text-gray-400 text-sm mt-1">Intenta con otros filtros o agrega uno nuevo</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((acceso) => (
            <AccesoCard key={acceso.id} acceso={acceso} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <AccesoFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initialData={editData}
        mode={editMode}
      />
    </div>
  );
}
