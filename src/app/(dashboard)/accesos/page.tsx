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
  Archive,
  ArchiveRestore,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchableSelect } from "@/components/ui/searchable-select";
import AccesoFormModal, { AccesoFormData, TipoAcceso } from "@/components/accesos/AccesoFormModal";
import { useAppSession } from "@/hooks/useAppSession";
import { EmpresaMock } from "@/lib/empresas-mock";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Acceso {
  id: string;
  empresaId?: string;
  empresa: string;
  tipo: TipoAcceso;
  plataforma: string;
  usuario: string;
  contrasena: string;
  correoAsociado?: string;
  tags: string[];
  ultimoAcceso: string;
  archivado?: boolean;
  observaciones?: string;
  // DIAN-specific
  nitTercero?: string;
  tipoDocumento?: string;
  // Generic-specific
  nitEmpresa?: string;
  nombreSoftware?: string;
}


// ── Tipo Config ────────────────────────────────────────────────────────────────

const TIPO_CONFIG: Record<
  TipoAcceso,
  { label: string; color: string; border: string; bg: string; badgeClass: string; Icon: React.ElementType; logoUrl: string }
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

function CopyBtn({ getValue }: { getValue: () => string | Promise<string> }) {
  const [done, setDone] = useState(false);
  const handle = async () => {
    const v = await getValue();
    if (!v) return;
    try { await navigator.clipboard.writeText(v); } catch {}
    setDone(true);
    setTimeout(() => setDone(false), 1500);
  };
  return (
    <button onClick={handle} title="Copiar" className="p-1 rounded text-gray-300 hover:text-gray-600 hover:bg-gray-200 transition-colors shrink-0">
      {done ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${d} ${months[parseInt(m) - 1]} ${y}`;
}

// ── Credential Card ────────────────────────────────────────────────────────────

function AccesoCard({
  acceso,
  archived = false,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}: {
  acceso: Acceso;
  archived?: boolean;
  onEdit: (a: Acceso) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [revealedPassword, setRevealedPassword] = useState<string | null>(null);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"archive" | "delete" | null>(null);

  const cfg = TIPO_CONFIG[acceso.tipo];
  const Icon = cfg.Icon;
  const showLogo = !!cfg.logoUrl && !logoError;

  const fetchPassword = useCallback(async (): Promise<string> => {
    if (revealedPassword !== null) return revealedPassword;
    try {
      const res = await fetch(`/api/accesos/${acceso.id}?reveal=true`);
      if (res.ok) {
        const data = await res.json();
        const pwd: string = data.contrasena ?? "";
        setRevealedPassword(pwd);
        return pwd;
      }
    } catch {}
    return "";
  }, [acceso.id, revealedPassword]);

  const handleTogglePassword = useCallback(async () => {
    if (!showPassword && revealedPassword === null) {
      setLoadingPassword(true);
      await fetchPassword();
      setLoadingPassword(false);
    }
    setShowPassword((v) => !v);
  }, [showPassword, revealedPassword, fetchPassword]);

  const handleCopy = useCallback(async () => {
    const pwd = await fetchPassword();
    if (!pwd) return;
    try {
      await navigator.clipboard.writeText(pwd);
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [fetchPassword]);

  return (
    <Card className={`border-l-4 ${cfg.border} transition-all duration-200 flex flex-col ${archived ? "opacity-70" : "hover:shadow-md"}`}>
      <CardContent className="p-4 flex flex-col gap-3 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${cfg.bg} shrink-0 overflow-hidden`}>
              {showLogo ? (
                <img src={cfg.logoUrl} alt={cfg.label} className="w-8 h-8 object-contain" onError={() => setLogoError(true)} />
              ) : (
                <Icon className={`w-5 h-5 ${cfg.color}`} />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 leading-tight truncate">{acceso.plataforma}</p>
              <p className="text-xs text-gray-400 truncate mt-0.5">{acceso.empresa}</p>
            </div>
          </div>
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold shrink-0 ${cfg.badgeClass}`}>
            {cfg.label}
          </span>
        </div>

        {/* Credentials */}
        <div className="space-y-2 bg-gray-50 rounded-lg p-3">
          {acceso.nitEmpresa && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-20 shrink-0 font-medium">NIT empresa:</span>
              <span className="text-xs text-gray-800 font-mono truncate flex-1">{acceso.nitEmpresa}</span>
              <CopyBtn getValue={() => acceso.nitEmpresa ?? ""} />
            </div>
          )}
          {acceso.nombreSoftware && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-20 shrink-0 font-medium">Software:</span>
              <span className="text-xs text-gray-800 truncate flex-1">{acceso.nombreSoftware}</span>
              <CopyBtn getValue={() => acceso.nombreSoftware ?? ""} />
            </div>
          )}
          {acceso.tipo === "DIAN" && acceso.nitTercero && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-20 shrink-0 font-medium">NIT tercero:</span>
              <span className="text-xs text-gray-800 font-mono truncate flex-1">{acceso.nitTercero}</span>
              <CopyBtn getValue={() => acceso.nitTercero ?? ""} />
            </div>
          )}
          {acceso.tipo === "DIAN" && acceso.tipoDocumento && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-20 shrink-0 font-medium">Tipo doc.:</span>
              <span className="text-xs text-gray-700 truncate flex-1">{acceso.tipoDocumento}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-20 shrink-0 font-medium">
              {acceso.tipo === "DIAN" ? "Núm. doc.:" : "Usuario:"}
            </span>
            <span className="text-xs text-gray-800 font-mono truncate flex-1">{acceso.usuario}</span>
            <CopyBtn getValue={() => acceso.usuario} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-20 shrink-0 font-medium">Contraseña:</span>
            <span className="text-xs text-gray-800 font-mono flex-1 truncate">
              {showPassword ? (revealedPassword ?? "●●●●●●●●") : "●●●●●●●●"}
            </span>
            <CopyBtn getValue={fetchPassword} />
            <button
              onClick={handleTogglePassword}
              disabled={loadingPassword}
              className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors shrink-0 disabled:opacity-50"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Tags */}
        {acceso.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {acceso.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                <Tag className="w-2.5 h-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Observaciones */}
        {acceso.observaciones && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 overflow-hidden">
            <p className="text-xs text-amber-700 leading-relaxed break-all">{acceso.observaciones}</p>
          </div>
        )}

        {/* Footer */}
        <div className="pt-1 border-t border-gray-100 mt-auto">
          {/* Confirmation: archive */}
          {confirmAction === "archive" && (
            <div className="flex items-center justify-between gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <span className="text-xs text-amber-700 font-medium">¿Archivar este acceso?</span>
              <div className="flex gap-1.5">
                <Button size="sm" variant="outline" onClick={() => setConfirmAction(null)} className="h-7 px-2 text-xs text-gray-600">
                  Cancelar
                </Button>
                <Button size="sm" onClick={() => onArchive(acceso.id)} className="h-7 px-2 text-xs bg-amber-500 hover:bg-amber-600 text-white border-0">
                  Sí, archivar
                </Button>
              </div>
            </div>
          )}

          {/* Confirmation: delete */}
          {confirmAction === "delete" && (
            <div className="flex items-center justify-between gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <span className="text-xs text-red-700 font-medium">¿Eliminar definitivamente?</span>
              <div className="flex gap-1.5">
                <Button size="sm" variant="outline" onClick={() => setConfirmAction(null)} className="h-7 px-2 text-xs text-gray-600">
                  Cancelar
                </Button>
                <Button size="sm" onClick={() => onDelete(acceso.id)} className="h-7 px-2 text-xs bg-red-600 hover:bg-red-700 text-white border-0">
                  Sí, eliminar
                </Button>
              </div>
            </div>
          )}

          {/* Normal footer */}
          {confirmAction === null && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Último acceso: {formatDate(acceso.ultimoAcceso)}</span>
              <div className="flex items-center gap-1">
                {!archived ? (
                  <>
                    <Button size="sm" variant="outline" onClick={() => onEdit(acceso)} className="h-7 px-2 text-xs gap-1 text-gray-500 hover:text-blue-600 hover:border-blue-300">
                      <Pencil className="w-3 h-3" />Editar
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCopy}
                      className={`h-7 px-2 text-xs gap-1 transition-all ${copied ? "border-green-400 text-green-600 bg-green-50" : "text-gray-500 hover:text-blue-600 hover:border-blue-300"}`}
                    >
                      {copied ? <><Check className="w-3 h-3" />Copiado!</> : <><Copy className="w-3 h-3" />Copiar</>}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setConfirmAction("archive")} className="h-7 px-2 text-xs gap-1 text-gray-500 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50">
                      <Archive className="w-3 h-3" />Archivar
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="outline" onClick={() => onRestore(acceso.id)} className="h-7 px-2 text-xs gap-1 text-gray-500 hover:text-green-600 hover:border-green-300 hover:bg-green-50">
                      <ArchiveRestore className="w-3 h-3" />Restaurar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setConfirmAction("delete")} className="h-7 px-2 text-xs gap-1 text-gray-500 hover:text-red-600 hover:border-red-300 hover:bg-red-50">
                      <Trash2 className="w-3 h-3" />Eliminar
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Filters bar (shared between tabs) ─────────────────────────────────────────

function FiltersBar({
  search, setSearch,
  empresaFilter, setEmpresaFilter,
  tipoFilter, setTipoFilter,
  count,
  empresas,
}: {
  search: string; setSearch: (v: string) => void;
  empresaFilter: string; setEmpresaFilter: (v: string) => void;
  tipoFilter: string; setTipoFilter: (v: string) => void;
  count: number;
  empresas: string[];
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Buscar plataforma, empresa, usuario..." className="pl-9 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <SearchableSelect
            value={empresaFilter} onValueChange={setEmpresaFilter}
            placeholder="Empresa" searchPlaceholder="Buscar empresa..." className="w-44"
            options={[{ value: "todas", label: "Todas las empresas" }, ...empresas.map((e) => ({ value: e, label: e }))]}
          />
          <SearchableSelect
            value={tipoFilter} onValueChange={setTipoFilter}
            placeholder="Tipo" searchPlaceholder="Buscar tipo..." className="w-48"
            options={[
              { value: "todos", label: "Todos los tipos" },
              { value: "DIAN", label: "DIAN" },
              { value: "HACIENDA_BOGOTA", label: "Hacienda Bogotá" },
              { value: "HACIENDA_CALI", label: "Hacienda Cali" },
              { value: "PARAFISCAL", label: "Parafiscal" },
              { value: "CAMARA", label: "Cámara de Comercio" },
              { value: "SUPERSOCIEDADES", label: "Supersociedades" },
              { value: "SOFTWARE_CONTABLE", label: "Software Contable" },
              { value: "OTRO", label: "Otro" },
            ]}
          />
          <div className="flex-1 hidden sm:block" />
          <p className="text-sm text-gray-500 shrink-0">
            <span className="font-semibold text-gray-900">{count}</span> acceso{count !== 1 ? "s" : ""}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

function normAcceso(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function matchesActiva(empresa: string, activaSet: Set<string>): boolean {
  if (activaSet.size === 0) return false;
  const n = normAcceso(empresa);
  for (const a of activaSet) {
    if (n === a || n.includes(a) || a.includes(n)) return true;
  }
  return false;
}

export default function AccesosPage() {
  const { appSession: session } = useAppSession();
  const [accesos, setAccesos] = useState<Acceso[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [empresasData, setEmpresasData] = useState<EmpresaMock[]>([]);
  const [empresasLoaded, setEmpresasLoaded] = useState(false);

  // Shared filters
  const [searchActive, setSearchActive] = useState("");
  const [empresaFilterActive, setEmpresaFilterActive] = useState("todas");
  const [tipoFilterActive, setTipoFilterActive] = useState("todos");

  const [searchArchived, setSearchArchived] = useState("");
  const [empresaFilterArchived, setEmpresaFilterArchived] = useState("todas");
  const [tipoFilterArchived, setTipoFilterArchived] = useState("todos");

  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<Partial<AccesoFormData> | undefined>();
  const [editMode, setEditMode] = useState<"create" | "edit">("create");
  const [editId, setEditId] = useState<string | null>(null);

  // Load empresas on mount; session comes from useAppSession hook
  useEffect(() => {
    async function loadEmpresas() {
      try {
        const res = await fetch("/api/app-empresas");
        if (res.status === 200) {
          const data: EmpresaMock[] = await res.json();
          setEmpresasData(Array.isArray(data) ? data : []);
          setEmpresasLoaded(true);
          return;
        }
      } catch {}
      // 204 or error → server not yet initialized, fall back to localStorage
      try {
        const stored = localStorage.getItem("empresas-data");
        if (stored) {
          const parsed = JSON.parse(stored) as EmpresaMock[];
          if (Array.isArray(parsed)) setEmpresasData(parsed);
        }
      } catch {}
      setEmpresasLoaded(true);
    }
    loadEmpresas();
  }, []);

  // Load accesos from DB on mount
  useEffect(() => {
    fetch("/api/accesos?all=1")
      .then(async (r) => {
        if (r.ok) {
          const data: Acceso[] = await r.json();
          if (Array.isArray(data)) setAccesos(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // For non-admin roles: only show accesos of assigned empresas.
  // NOTE: empresaIds are Prisma CUIDs (string); file-based empresa IDs are numeric.
  // Until full data migration to Prisma, non-admin users will see no accesos.
  const empresasPermitidas: Set<string> | null =
    session && session.role !== "admin"
      ? new Set(
          empresasData
            .filter((e) => session.empresaIds.includes(String(e.id)))
            .map((e) => e.razonSocial)
        )
      : null;

  const visibleAccesos = empresasPermitidas
    ? accesos.filter((a) => empresasPermitidas!.has(a.empresa))
    : accesos;

  const activeAccesos = visibleAccesos.filter((a) => !a.archivado);
  const archivedAccesos = visibleAccesos.filter((a) => !!a.archivado);
  const empresas = Array.from(new Set(visibleAccesos.map((a) => a.empresa))).sort();

  // Only ACTIVA empresas shown in the create/edit form dropdown
  const activaEmpresas = empresasData
    .filter((e) => e.estado === "ACTIVA")
    .map((e) => e.razonSocial)
    .sort();

  const applyFilters = (list: Acceso[], search: string, empresa: string, tipo: string) =>
    list.filter((a) => {
      const q = search.toLowerCase();
      const matchSearch =
        a.plataforma.toLowerCase().includes(q) ||
        a.empresa.toLowerCase().includes(q) ||
        a.usuario.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q));
      const matchEmpresa = empresa === "todas" || a.empresa === empresa;
      const matchTipo = tipo === "todos" || a.tipo === tipo;
      return matchSearch && matchEmpresa && matchTipo;
    });

  const filteredActive = applyFilters(activeAccesos, searchActive, empresaFilterActive, tipoFilterActive);
  const filteredArchived = applyFilters(archivedAccesos, searchArchived, empresaFilterArchived, tipoFilterArchived);

  const handleOpenCreate = () => {
    setEditData(undefined);
    setEditMode("create");
    setEditId(null);
    setModalOpen(true);
  };

  const handleEdit = (a: Acceso) => {
    setEditData({
      empresa: a.empresa, tipo: a.tipo, plataforma: a.plataforma,
      usuario: a.usuario, contrasena: a.contrasena, confirmarContrasena: a.contrasena,
      correoAsociado: a.correoAsociado ?? "", tags: a.tags,
      nitTercero: a.nitTercero ?? "", tipoDocumento: a.tipoDocumento ?? "",
      nitEmpresa: a.nitEmpresa ?? "", nombreSoftware: a.nombreSoftware ?? "", observaciones: a.observaciones ?? "",
    });
    setEditMode("edit");
    setEditId(a.id);
    setModalOpen(true);
  };

  const handleArchive = async (id: string) => {
    try {
      const res = await fetch(`/api/accesos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archivado: true }),
      });
      if (res.ok) setAccesos((prev) => prev.map((a) => a.id === id ? { ...a, archivado: true } : a));
    } catch {}
  };

  const handleRestore = async (id: string) => {
    try {
      const res = await fetch(`/api/accesos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archivado: false }),
      });
      if (res.ok) setAccesos((prev) => prev.map((a) => a.id === id ? { ...a, archivado: false } : a));
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/accesos/${id}`, { method: "DELETE" });
      if (res.ok) setAccesos((prev) => prev.filter((a) => a.id !== id));
    } catch {}
  };

  const handleSave = async (data: AccesoFormData) => {
    if (editMode === "create") {
      try {
        const res = await fetch("/api/accesos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            empresaNombre: data.empresa,
            tipo: data.tipo,
            plataforma: data.plataforma,
            usuario: data.usuario,
            contrasena: data.contrasena,
            correoAsociado: data.correoAsociado || undefined,
            tags: data.tags,
            nitTercero: data.nitTercero || undefined,
            tipoDocumento: data.tipoDocumento || undefined,
            nitEmpresa: data.nitEmpresa || undefined,
            nombreSoftware: data.nombreSoftware || undefined,
            observaciones: data.observaciones || undefined,
          }),
        });
        if (res.ok) {
          const acceso: Acceso = await res.json();
          setAccesos((prev) => [acceso, ...prev]);
        }
      } catch {}
    } else if (editId !== null) {
      try {
        const res = await fetch(`/api/accesos/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipo: data.tipo,
            plataforma: data.plataforma,
            usuario: data.usuario,
            contrasena: data.contrasena,
            correoAsociado: data.correoAsociado || undefined,
            tags: data.tags,
            nitTercero: data.nitTercero || undefined,
            tipoDocumento: data.tipoDocumento || undefined,
            nitEmpresa: data.nitEmpresa || undefined,
            nombreSoftware: data.nombreSoftware || undefined,
            observaciones: data.observaciones || undefined,
          }),
        });
        if (res.ok) {
          setAccesos((prev) =>
            prev.map((a) =>
              a.id === editId ? {
                ...a,
                empresa: data.empresa,
                tipo: data.tipo as TipoAcceso,
                plataforma: data.plataforma,
                usuario: data.usuario,
                contrasena: "••••••",
                correoAsociado: data.correoAsociado || undefined,
                tags: data.tags,
                nitTercero: data.nitTercero || undefined,
                tipoDocumento: data.tipoDocumento || undefined,
                nitEmpresa: data.nitEmpresa || undefined,
                nombreSoftware: data.nombreSoftware || undefined,
                observaciones: data.observaciones || undefined,
              } : a
            )
          );
        }
      } catch {}
    }
    setModalOpen(false);
  };

  const emptyActive = (
    <div className="text-center py-20">
      <KeyRound className="w-12 h-12 text-gray-200 mx-auto mb-3" />
      <p className="text-gray-500 font-medium">No se encontraron accesos</p>
      <p className="text-gray-400 text-sm mt-1">Intenta con otros filtros o agrega uno nuevo</p>
    </div>
  );

  const emptyArchived = (
    <div className="text-center py-20">
      <Archive className="w-12 h-12 text-gray-200 mx-auto mb-3" />
      <p className="text-gray-500 font-medium">No hay accesos archivados</p>
      <p className="text-gray-400 text-sm mt-1">Los accesos archivados aparecerán aquí</p>
    </div>
  );

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
            <p className="text-sm text-gray-500 mt-0.5">Bóveda segura de credenciales para todas las plataformas</p>
          </div>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
          <Plus className="w-4 h-4" />Agregar Acceso
        </Button>
      </div>

      {/* Security Banner */}
      <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
        <p className="text-sm text-blue-700">
          <span className="font-semibold">Acceso seguro:</span> Las contraseñas están cifradas. Solo usuarios autorizados pueden ver las contraseñas.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Accesos activos", value: activeAccesos.length, color: "text-gray-900", bg: "bg-white" },
          { label: "DIAN", value: activeAccesos.filter((a) => a.tipo === "DIAN").length, color: "text-green-700", bg: "bg-green-50" },
          { label: "Hacienda", value: activeAccesos.filter((a) => a.tipo === "HACIENDA_BOGOTA" || a.tipo === "HACIENDA_CALI").length, color: "text-red-700", bg: "bg-red-50" },
          { label: "Parafiscales", value: activeAccesos.filter((a) => a.tipo === "PARAFISCAL").length, color: "text-orange-700", bg: "bg-orange-50" },
        ].map((s) => (
          <Card key={s.label} className={`${s.bg} border`}>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-500">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="activos">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="activos" className="gap-2">
            <ShieldCheck className="w-4 h-4" />
            Activos
            <span className="ml-1 bg-blue-100 text-blue-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">
              {activeAccesos.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="archivados" className="gap-2">
            <Archive className="w-4 h-4" />
            Archivados
            {archivedAccesos.length > 0 && (
              <span className="ml-1 bg-amber-100 text-amber-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                {archivedAccesos.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Activos ── */}
        <TabsContent value="activos" className="space-y-4 mt-4">
          <FiltersBar
            search={searchActive} setSearch={setSearchActive}
            empresaFilter={empresaFilterActive} setEmpresaFilter={setEmpresaFilterActive}
            tipoFilter={tipoFilterActive} setTipoFilter={setTipoFilterActive}
            count={filteredActive.length} empresas={empresas}
          />
          {filteredActive.length === 0 ? emptyActive : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredActive.map((acceso) => (
                <AccesoCard
                  key={acceso.id} acceso={acceso} archived={false}
                  onEdit={handleEdit} onArchive={handleArchive}
                  onRestore={handleRestore} onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Tab: Archivados ── */}
        <TabsContent value="archivados" className="space-y-4 mt-4">
          <FiltersBar
            search={searchArchived} setSearch={setSearchArchived}
            empresaFilter={empresaFilterArchived} setEmpresaFilter={setEmpresaFilterArchived}
            tipoFilter={tipoFilterArchived} setTipoFilter={setTipoFilterArchived}
            count={filteredArchived.length} empresas={empresas}
          />
          {filteredArchived.length === 0 ? emptyArchived : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredArchived.map((acceso) => (
                <AccesoCard
                  key={acceso.id} acceso={acceso} archived={true}
                  onEdit={handleEdit} onArchive={handleArchive}
                  onRestore={handleRestore} onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AccesoFormModal
        open={modalOpen} onClose={() => setModalOpen(false)}
        onSave={handleSave} initialData={editData} mode={editMode}
        empresas={activaEmpresas}
      />
    </div>
  );
}
