"use client";

import { useState } from "react";
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

// ── Types ──────────────────────────────────────────────────────────────────────

interface Empresa {
  id: number;
  razonSocial: string;
  nit: string;
  ciudad: string;
  departamento: string;
  regimen: string;
  estado: "ACTIVA" | "INACTIVA";
  representante: string;
  telefono: string;
  correo: string;
}

// ── Mock data ──────────────────────────────────────────────────────────────────

const EMPRESAS: Empresa[] = [
  {
    id: 1,
    razonSocial: "X TOURS SAS",
    nit: "901234567-8",
    ciudad: "Bogotá",
    departamento: "Cundinamarca",
    regimen: "Régimen Ordinario",
    estado: "ACTIVA",
    representante: "Carlos Ramírez",
    telefono: "601 320 4500",
    correo: "contabilidad@xtours.co",
  },
  {
    id: 2,
    razonSocial: "DIAZAR LTDA",
    nit: "800123456-1",
    ciudad: "Bogotá",
    departamento: "Cundinamarca",
    regimen: "SIMPLE",
    estado: "ACTIVA",
    representante: "Diana Zaraza",
    telefono: "601 298 7600",
    correo: "diana@diazar.com",
  },
  {
    id: 3,
    razonSocial: "300 HILOS SAS",
    nit: "890765432-5",
    ciudad: "Medellín",
    departamento: "Antioquia",
    regimen: "Régimen Ordinario",
    estado: "ACTIVA",
    representante: "Jorge Hilo",
    telefono: "604 444 3200",
    correo: "info@300hilos.com",
  },
  {
    id: 4,
    razonSocial: "TEXTILES DEL NORTE SAS",
    nit: "900876543-2",
    ciudad: "Barranquilla",
    departamento: "Atlántico",
    regimen: "Régimen Ordinario",
    estado: "ACTIVA",
    representante: "Ana Herrera",
    telefono: "605 360 1122",
    correo: "administracion@textilesnorte.co",
  },
  {
    id: 5,
    razonSocial: "INVERSIONES CASTILLO SAS",
    nit: "800345678-9",
    ciudad: "Bogotá",
    departamento: "Cundinamarca",
    regimen: "Gran Contribuyente",
    estado: "ACTIVA",
    representante: "Roberto Castillo",
    telefono: "601 625 8800",
    correo: "rcastillo@inversionescastillo.com",
  },
  {
    id: 6,
    razonSocial: "COMERCIAL TORRES LTDA",
    nit: "830567890-4",
    ciudad: "Cali",
    departamento: "Valle del Cauca",
    regimen: "Régimen Ordinario",
    estado: "ACTIVA",
    representante: "María Torres",
    telefono: "602 884 5600",
    correo: "mtorres@comercialtorres.co",
  },
  {
    id: 7,
    razonSocial: "LOGÍSTICA ANDINA SAS",
    nit: "901567890-6",
    ciudad: "Bucaramanga",
    departamento: "Santander",
    regimen: "Régimen Ordinario",
    estado: "ACTIVA",
    representante: "Luis Andrade",
    telefono: "607 697 4400",
    correo: "logistica@andinasas.co",
  },
  {
    id: 8,
    razonSocial: "CONSTRUCTORA CIMA SAS",
    nit: "900234567-3",
    ciudad: "Medellín",
    departamento: "Antioquia",
    regimen: "Régimen Ordinario",
    estado: "ACTIVA",
    representante: "Felipe Cima",
    telefono: "604 311 9900",
    correo: "fcima@constructoracima.com",
  },
  {
    id: 9,
    razonSocial: "INMOBILIARIA DEL PACÍFICO SAS",
    nit: "901876543-2",
    ciudad: "Cali",
    departamento: "Valle del Cauca",
    regimen: "SIMPLE",
    estado: "ACTIVA",
    representante: "Sandra Prado",
    telefono: "602 552 7700",
    correo: "sprado@inmopacifico.com",
  },
  {
    id: 10,
    razonSocial: "CONSULTORES DIGITALES LTDA",
    nit: "900456789-0",
    ciudad: "Bogotá",
    departamento: "Cundinamarca",
    regimen: "Régimen Ordinario",
    estado: "ACTIVA",
    representante: "Andrés Morales",
    telefono: "601 789 3300",
    correo: "amorales@consdig.co",
  },
  {
    id: 11,
    razonSocial: "SERVILOGÍSTICA EXPRESS SAS",
    nit: "890234567-1",
    ciudad: "Barranquilla",
    departamento: "Atlántico",
    regimen: "Régimen Ordinario",
    estado: "INACTIVA",
    representante: "Patricia Vega",
    telefono: "605 419 6600",
    correo: "pvega@servilogistica.co",
  },
  {
    id: 12,
    razonSocial: "AGROPECUARIA SAN PABLO SAS",
    nit: "800678901-7",
    ciudad: "Villavicencio",
    departamento: "Meta",
    regimen: "Régimen Simple",
    estado: "INACTIVA",
    representante: "Jaime Salcedo",
    telefono: "608 662 1800",
    correo: "jsalcedo@agrosanpablo.co",
  },
];

const CIUDADES = ["Todas", "Bogotá", "Medellín", "Cali", "Barranquilla", "Bucaramanga", "Villavicencio"];

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

// ── Page ───────────────────────────────────────────────────────────────────────

export default function EmpresasPage() {
  const [view, setView] = useState<"table" | "cards">("table");
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("todos");
  const [ciudadFilter, setCiudadFilter] = useState("Todas");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const PER_PAGE = 8;

  const filtered = EMPRESAS.filter((e) => {
    const matchSearch =
      e.razonSocial.toLowerCase().includes(search.toLowerCase()) ||
      e.nit.includes(search) ||
      e.representante.toLowerCase().includes(search.toLowerCase());
    const matchEstado =
      estadoFilter === "todos" || e.estado === estadoFilter;
    const matchCiudad =
      ciudadFilter === "Todas" || e.ciudad === ciudadFilter;
    return matchSearch && matchEstado && matchCiudad;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const activas = EMPRESAS.filter((e) => e.estado === "ACTIVA").length;
  const inactivas = EMPRESAS.filter((e) => e.estado === "INACTIVA").length;

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
        <Button
          onClick={() => setModalOpen(true)}
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva Empresa
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Empresas", value: EMPRESAS.length, color: "text-gray-900", bg: "bg-white" },
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
                        variant={empresa.estado === "ACTIVA" ? "success" : "secondary"}
                        className="text-xs"
                      >
                        {empresa.estado}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-xs text-gray-600">
                      {empresa.representante}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/empresas/${empresa.id}`}>
                          <button className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Ver">
                            <Eye className="w-4 h-4" />
                          </button>
                        </Link>
                        <button className="p-1.5 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors" title="Editar">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors" title="Más opciones">
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

      {/* Modal */}
      <EmpresaFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
