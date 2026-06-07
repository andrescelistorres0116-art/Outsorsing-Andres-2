"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  Search,
  Eye,
  Pencil,
  MoreHorizontal,
  LayoutGrid,
  List,
  Phone,
  Mail,
  MapPin,
  ChevronLeft,
  ChevronRight,
  UserCircle2,
  Trash2,
  PowerOff,
  Power,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import EmpresaFormModal from "@/components/empresas/EmpresaFormModal";
import { EmpresaMock, EMPRESAS_MOCK } from "@/lib/empresas-mock";
import { getSessionFresh, AppSession } from "@/lib/app-auth";

// Empresa is EmpresaMock — single source of truth in @/lib/empresas-mock
type Empresa = EmpresaMock;

const CIUDADES = ["Todas", "Bogotá", "Medellín", "Cali", "Barranquilla", "Bucaramanga", "Villavicencio"];

function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function getEstadoEfectivo(empresa: Empresa): "ACTIVA" | "INACTIVA" {
  if (empresa.fechaFinRelacion) {
    const today = new Date().toISOString().split("T")[0];
    if (empresa.fechaFinRelacion <= today) return "INACTIVA";
  }
  return empresa.estado;
}

function normName(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

// Remove all calendar obligations for a given empresa razonSocial from localStorage
function cleanCalendarioObligaciones(razonSocial: string) {
  try {
    const stored = localStorage.getItem("calendario-obligaciones");
    if (!stored) return;
    const obs: Array<{ empresa: string }> = JSON.parse(stored);
    const rn = normName(razonSocial);
    const filtered = obs.filter((o) => {
      const on = normName(o.empresa);
      return !on.includes(rn) && !rn.includes(on);
    });
    localStorage.setItem("calendario-obligaciones", JSON.stringify(filtered));
  } catch {}
}

// Archive all accesos for a given empresa in the server store
async function archiveAccesosForEmpresa(razonSocial: string) {
  try {
    const res = await fetch("/api/app-accesos");
    if (!res.ok) return;
    const accesos: Array<{ empresa: string; archivado?: boolean }> = await res.json();
    const rn = normName(razonSocial);
    const updated = accesos.map((a) => {
      const an = normName(a.empresa);
      if (an === rn || an.includes(rn) || rn.includes(an)) return { ...a, archivado: true };
      return a;
    });
    await fetch("/api/app-accesos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
  } catch {}
}

// ── Components ─────────────────────────────────────────────────────────────────

function EmpresaCard({ empresa }: { empresa: Empresa }) {
  return (
    <Link href={`/empresas/${empresa.id}`}>
      <Card className="group hover:shadow-md hover:border-blue-200 transition-all duration-200 cursor-pointer h-full">
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 shrink-0 group-hover:bg-blue-100 transition-colors">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 leading-tight truncate">
                  {empresa.razonSocial}
                </p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">
                  NIT {empresa.nit}
                </p>
              </div>
            </div>
            <Badge
              variant={empresa.estado === "ACTIVA" ? "success" : "secondary"}
              className="text-xs shrink-0"
            >
              {empresa.estado}
            </Badge>
          </div>

          {/* Info */}
          <div className="space-y-1.5 mb-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              {empresa.ciudad}, {empresa.departamento}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <UserCircle2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              {empresa.representante}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate">{empresa.correo}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              {empresa.telefono}
            </div>
          </div>

          {/* Regimen */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">{empresa.regimen}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.preventDefault(); }}
                className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                title="Ver empresa"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.preventDefault(); }}
                className="p-1.5 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                title="Editar empresa"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ── Regimen mapping helpers ────────────────────────────────────────────────────

const REGIMEN_TO_VALUE: Record<string, string> = {
  "Régimen Ordinario": "ordinario",
  "SIMPLE": "simple",
  "Régimen Simple": "simple",
  "Gran Contribuyente": "gran_contribuyente",
  "Régimen Especial": "especial",
  "No Contribuyente": "no_contribuyente",
};

const VALUE_TO_REGIMEN: Record<string, string> = {
  ordinario: "Régimen Ordinario",
  simple: "SIMPLE",
  gran_contribuyente: "Gran Contribuyente",
  especial: "Régimen Especial",
  no_contribuyente: "No Contribuyente",
};

// ── Page ───────────────────────────────────────────────────────────────────────

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>(EMPRESAS_MOCK);
  // hydrated becomes true after the initial load from server/localStorage.
  // Prevents the save-effect from overwriting real data with EMPRESAS_MOCK
  // on every page mount (SSR hydration race condition).
  const [hydrated, setHydrated] = useState(false);

  // Load on mount: server is authoritative, localStorage is fallback
  useEffect(() => {
    async function load() {
      // 1. Try server store (persists across devices and browser clears)
      try {
        const res = await fetch("/api/app-empresas");
        if (res.ok) {
          const data: Empresa[] = await res.json();
          if (data.length > 0) {
            setEmpresas(data);
            setHydrated(true);
            return;
          }
        }
      } catch {}

      // 2. Fall back to localStorage
      try {
        const stored = localStorage.getItem("empresas-data");
        if (stored) {
          const parsed = JSON.parse(stored) as Empresa[];
          if (parsed.length > 0) {
            let maxId = parsed.reduce(
              (m, e) => (typeof e.id === "number" && isFinite(e.id) ? Math.max(m, e.id) : m),
              0
            );
            const sanitized = parsed.map((e) =>
              typeof e.id !== "number" || !isFinite(e.id) ? { ...e, id: ++maxId } : e
            );
            setEmpresas(sanitized);
            setHydrated(true);
            return;
          }
        }
      } catch {}

      // 3. No data anywhere → first-time setup, keep EMPRESAS_MOCK and persist it
      setHydrated(true);
    }
    load();
  }, []);

  // Persist changes — skip until initial load completes
  useEffect(() => {
    if (!hydrated) return;
    const json = JSON.stringify(empresas);
    localStorage.setItem("empresas-data", json);
    fetch("/api/app-empresas", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: json,
    }).catch(() => {});
  }, [empresas, hydrated]);
  const [session, setSession] = useState<AppSession | null>(null);
  const [view, setView] = useState<"table" | "cards">("table");
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("todos");
  const [ciudadFilter, setCiudadFilter] = useState("Todas");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 });

  useEffect(() => { getSessionFresh().then(setSession); }, []);

  function openCreate() {
    setEditingEmpresa(null);
    setModalKey((k) => k + 1);
    setModalOpen(true);
  }

  function openEdit(empresa: Empresa) {
    setEditingEmpresa(empresa);
    setModalKey((k) => k + 1);
    setModalOpen(true);
  }

  function handleDelete(empresa: Empresa) {
    setEmpresas((prev) => prev.filter((e) => e.id !== empresa.id));
    setMenuOpenId(null);
    cleanCalendarioObligaciones(empresa.razonSocial);
    archiveAccesosForEmpresa(empresa.razonSocial);
  }

  function handleToggleEstado(empresa: Empresa) {
    const efectivo = getEstadoEfectivo(empresa);
    setEmpresas((prev) => prev.map((e) =>
      e.id === empresa.id
        ? { ...e, estado: efectivo === "ACTIVA" ? "INACTIVA" : "ACTIVA", fechaFinRelacion: undefined }
        : e
    ));
    setMenuOpenId(null);
    if (efectivo === "ACTIVA") {
      archiveAccesosForEmpresa(empresa.razonSocial);
    }
  }

  const PER_PAGE = 8;

  // For non-admin roles: restrict to assigned empresaIds
  const visibleEmpresas =
    session && session.role !== "admin"
      ? empresas.filter((e) => session.empresaIds.includes(e.id))
      : empresas;

  const filtered = visibleEmpresas.filter((e) => {
    const matchSearch =
      e.razonSocial.toLowerCase().includes(search.toLowerCase()) ||
      e.nit.includes(search) ||
      e.representante.toLowerCase().includes(search.toLowerCase());
    const matchEstado =
      estadoFilter === "todos" || getEstadoEfectivo(e) === estadoFilter;
    const matchCiudad =
      ciudadFilter === "Todas" || e.ciudad === ciudadFilter;
    return matchSearch && matchEstado && matchCiudad;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const activas = visibleEmpresas.filter((e) => getEstadoEfectivo(e) === "ACTIVA").length;
  const inactivas = visibleEmpresas.filter((e) => getEstadoEfectivo(e) === "INACTIVA").length;

  const menuEmpresa = menuOpenId !== null ? (empresas.find((e) => e.id === menuOpenId) ?? null) : null;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Empresas</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gestión de clientes y empresas registradas
          </p>
        </div>
        {session?.role !== "contador" && <Button
          onClick={openCreate}
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva Empresa
        </Button>}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Empresas", value: empresas.length, color: "text-gray-900", bg: "bg-white" },
          { label: "Activas", value: activas, color: "text-green-700", bg: "bg-green-50" },
          { label: "Inactivas", value: inactivas, color: "text-gray-500", bg: "bg-white" },
        ].map((s) => (
          <Card key={s.label} className={s.bg}>
            <CardContent className="p-4 flex items-center gap-3">
              <div>
                <p className="text-xs font-medium text-gray-500">{s.label}</p>
                <p className={`text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter bar + view toggle */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar empresa, NIT, representante..."
                className="pl-9 h-9 text-sm"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>

            {/* Estado filter */}
            <Select
              value={estadoFilter}
              onValueChange={(v) => { setEstadoFilter(v); setPage(1); }}
            >
              <SelectTrigger className="w-36 h-9 text-sm">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="ACTIVA">Activa</SelectItem>
                <SelectItem value="INACTIVA">Inactiva</SelectItem>
              </SelectContent>
            </Select>

            {/* Ciudad filter */}
            <Select
              value={ciudadFilter}
              onValueChange={(v) => { setCiudadFilter(v); setPage(1); }}
            >
              <SelectTrigger className="w-40 h-9 text-sm">
                <SelectValue placeholder="Ciudad" />
              </SelectTrigger>
              <SelectContent>
                {CIUDADES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Spacer */}
            <div className="flex-1 hidden sm:block" />

            {/* View toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  view === "table"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                Tabla
              </button>
              <button
                onClick={() => setView("cards")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  view === "cards"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Cards
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Mostrando{" "}
          <span className="font-semibold text-gray-900">{filtered.length}</span>{" "}
          empresa{filtered.length !== 1 ? "s" : ""}
          {search && ` para "${search}"`}
        </p>
      </div>

      {/* TABLE VIEW */}
      {view === "table" && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Razón Social
                  </th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    NIT
                  </th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Ciudad
                  </th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Régimen
                  </th>
                  <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Representante
                  </th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Inicio Relación
                  </th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Fin Relación
                  </th>
                  <th className="text-right px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((empresa, idx) => (
                  <tr
                    key={empresa.id}
                    className={`hover:bg-blue-50/40 transition-colors ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                    }`}
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/empresas/${empresa.id}`}
                        className="flex items-center gap-3 group"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 shrink-0">
                          <Building2 className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm">
                          {empresa.razonSocial}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-gray-500">
                      {empresa.nit}
                    </td>
                    <td className="px-4 py-4 text-gray-600 text-xs">
                      <span>{empresa.ciudad}</span>
                      <span className="text-gray-400 block">{empresa.departamento}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center text-xs text-gray-600 bg-gray-100 rounded-full px-2.5 py-0.5 font-medium">
                        {empresa.regimen}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Badge
                        variant={getEstadoEfectivo(empresa) === "ACTIVA" ? "success" : "secondary"}
                        className="text-xs"
                      >
                        {getEstadoEfectivo(empresa)}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-xs text-gray-600">
                      {empresa.representante}
                    </td>
                    <td className="px-4 py-4 text-xs text-gray-600 whitespace-nowrap">
                      {fmtDate(empresa.fechaInicioRelacion)}
                    </td>
                    <td className="px-4 py-4 text-xs whitespace-nowrap">
                      {empresa.fechaFinRelacion ? (
                        <span className="text-red-500 font-medium">{fmtDate(empresa.fechaFinRelacion)}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/empresas/${empresa.id}`}>
                          <button className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Ver">
                            <Eye className="w-4 h-4" />
                          </button>
                        </Link>
                        <button
                          onClick={() => openEdit(empresa)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {/* Three-dot button — dropdown rendered at page level to escape overflow clipping */}
                        <button
                          onClick={(e) => {
                            if (menuOpenId === empresa.id) {
                              setMenuOpenId(null);
                            } else {
                              const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                              setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                              setMenuOpenId(empresa.id);
                            }
                          }}
                          className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                          title="Más opciones"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {paginated.length === 0 && (
              <div className="text-center py-16">
                <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No se encontraron empresas</p>
                <p className="text-gray-400 text-sm mt-1">
                  Intenta con otros filtros de búsqueda
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* CARDS VIEW */}
      {view === "cards" && (
        <>
          {paginated.length === 0 ? (
            <div className="text-center py-20">
              <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No se encontraron empresas</p>
              <p className="text-gray-400 text-sm mt-1">
                Intenta con otros filtros de búsqueda
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {paginated.map((empresa) => (
                <EmpresaCard key={empresa.id} empresa={empresa} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Página {page} de {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Anterior
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                    p === page
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="gap-1"
            >
              Siguiente
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Three-dot dropdown — fixed position to escape overflow-x-auto clipping */}
      {menuEmpresa && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setMenuOpenId(null)} />
          <div
            style={{ top: menuPos.top, right: menuPos.right }}
            className="fixed z-40 w-48 bg-white border border-gray-200 rounded-xl shadow-xl shadow-black/10 py-1 overflow-hidden"
          >
            <button
              onClick={() => handleToggleEstado(menuEmpresa)}
              className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {getEstadoEfectivo(menuEmpresa) === "ACTIVA" ? (
                <><PowerOff className="w-3.5 h-3.5 text-orange-500" />Marcar como Inactiva</>
              ) : (
                <><Power className="w-3.5 h-3.5 text-green-600" />Marcar como Activa</>
              )}
            </button>
            {session?.role !== "contador" && (
              <>
                <div className="my-1 border-t border-gray-100" />
                <button
                  onClick={() => handleDelete(menuEmpresa)}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar empresa
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* Modal — key forces remount on every open so form always resets to saved data */}
      <EmpresaFormModal
        key={modalKey}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingEmpresa(null); }}
        mode={editingEmpresa ? "edit" : "create"}
        initialData={editingEmpresa ? {
          razonSocial: editingEmpresa.razonSocial,
          nombreComercial: editingEmpresa.nombreComercial ?? "",
          nit: editingEmpresa.nit.split("-")[0] ?? editingEmpresa.nit,
          dv: editingEmpresa.nit.split("-")[1] ?? "",
          direccion: editingEmpresa.direccion ?? "",
          ciudad: editingEmpresa.ciudad,
          departamento: editingEmpresa.departamento,
          telefono: editingEmpresa.telefono,
          correo: editingEmpresa.correo,
          estado: editingEmpresa.estado,
          fechaInicioRelacion: editingEmpresa.fechaInicioRelacion,
          fechaFinRelacion: editingEmpresa.fechaFinRelacion ?? "",
          repNombre: editingEmpresa.representante,
          repCedula: editingEmpresa.repCedula ?? "",
          repCorreo: editingEmpresa.repCorreo ?? "",
          repTelefono: editingEmpresa.repTelefono ?? "",
          regimen: REGIMEN_TO_VALUE[editingEmpresa.regimen] ?? "",
          responsabilidadIVA: editingEmpresa.responsabilidadIVA ?? "",
          obligadoFacturar: editingEmpresa.obligadoFacturar ?? true,
          actividadEconomica: editingEmpresa.actividadEconomica ?? "",
          tipoContribuyente: editingEmpresa.tipoContribuyente ?? "Persona Jurídica",
          agenteRetenedor: editingEmpresa.agenteRetenedor ?? false,
          softwareContable: editingEmpresa.softwareContable ?? "",
          tipoNomina: editingEmpresa.tipoNomina ?? "",
          periodicidadNomina: editingEmpresa.periodicidadNomina ?? "",
        } : undefined}
        onSave={(data) => {
          if (editingEmpresa) {
            setEmpresas((prev) => prev.map((e) =>
              e.id === editingEmpresa.id ? {
                ...e,
                razonSocial: data.razonSocial,
                nombreComercial: data.nombreComercial,
                nit: data.dv ? `${data.nit}-${data.dv}` : data.nit,
                direccion: data.direccion,
                ciudad: data.ciudad,
                departamento: data.departamento,
                telefono: data.telefono,
                correo: data.correo,
                estado: data.estado as "ACTIVA" | "INACTIVA",
                fechaInicioRelacion: data.fechaInicioRelacion,
                fechaFinRelacion: data.fechaFinRelacion || undefined,
                representante: data.repNombre,
                repCedula: data.repCedula,
                repCorreo: data.repCorreo,
                repTelefono: data.repTelefono,
                regimen: VALUE_TO_REGIMEN[data.regimen] ?? data.regimen,
                responsabilidadIVA: data.responsabilidadIVA,
                obligadoFacturar: data.obligadoFacturar,
                actividadEconomica: data.actividadEconomica,
                tipoContribuyente: data.tipoContribuyente,
                agenteRetenedor: data.agenteRetenedor,
                softwareContable: data.softwareContable,
                tipoNomina: data.tipoNomina,
                periodicidadNomina: data.periodicidadNomina,
              } : e
            ));
          } else {
            const newId = empresas.length > 0 ? Math.max(...empresas.map((e) => e.id)) + 1 : 1;
            setEmpresas((prev) => [...prev, {
              id: newId,
              razonSocial: data.razonSocial,
              nombreComercial: data.nombreComercial,
              nit: data.dv ? `${data.nit}-${data.dv}` : data.nit,
              direccion: data.direccion,
              ciudad: data.ciudad,
              departamento: data.departamento,
              telefono: data.telefono,
              correo: data.correo,
              estado: data.estado as "ACTIVA" | "INACTIVA",
              fechaInicioRelacion: data.fechaInicioRelacion,
              fechaFinRelacion: data.fechaFinRelacion || undefined,
              representante: data.repNombre,
              repCedula: data.repCedula,
              repCorreo: data.repCorreo,
              repTelefono: data.repTelefono,
              regimen: VALUE_TO_REGIMEN[data.regimen] ?? data.regimen,
              responsabilidadIVA: data.responsabilidadIVA,
              obligadoFacturar: data.obligadoFacturar,
              actividadEconomica: data.actividadEconomica,
              tipoContribuyente: data.tipoContribuyente,
              agenteRetenedor: data.agenteRetenedor,
              softwareContable: data.softwareContable,
              tipoNomina: data.tipoNomina,
              periodicidadNomina: data.periodicidadNomina,
            }]);
          }
        }}
      />
    </div>
  );
}
