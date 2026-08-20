"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Pencil,
  Phone,
  Mail,
  MapPin,
  UserCircle2,
  CreditCard,
  CalendarCheck,
  History,
  Lock,
  BookOpen,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { EmpresaMock } from "@/lib/empresas-mock";

// ── Field helpers ──────────────────────────────────────────────────────────────

function InfoField({ label, value, mono = false }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-medium text-gray-900 ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </p>
    </div>
  );
}

function BooleanField({ label, value }: { label: string; value?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <div className="flex items-center gap-1.5">
        {value ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Sí</span>
          </>
        ) : (
          <>
            <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
            <span className="text-sm font-medium text-gray-400">No</span>
          </>
        )}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function EmpresaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [empresa, setEmpresa] = useState<EmpresaMock | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/app-empresas")
      .then(async (r) => {
        if (!r.ok) return;
        const data = await r.json();
        const found = Array.isArray(data)
          ? (data as EmpresaMock[]).find((e) => e.id === id) ?? null
          : null;
        setEmpresa(found);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
          <p className="text-sm text-gray-400">Cargando empresa...</p>
        </div>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="space-y-4">
        <Link href="/empresas">
          <button className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors shadow-sm">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
        </Link>
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-100 mb-4">
            <Building2 className="w-6 h-6 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-700">Empresa no encontrada</h2>
          <p className="text-sm text-gray-400 mt-1">
            La empresa que buscas no existe o fue eliminada.
          </p>
          <Link href="/empresas" className="mt-4">
            <Button variant="outline" size="sm">Ver todas las empresas</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/empresas">
            <button className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors shadow-sm">
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-blue-600 shadow-md shadow-blue-600/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">
                  {empresa.razonSocial}
                </h1>
                <Badge
                  variant={empresa.estado === "ACTIVA" ? "success" : "secondary"}
                  className="text-xs"
                >
                  {empresa.estado}
                </Badge>
              </div>
              <p className="text-sm text-gray-400 font-mono">
                NIT {empresa.nit}
              </p>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          className="gap-2 text-sm self-start sm:self-auto"
        >
          <Pencil className="w-4 h-4" />
          Editar Empresa
        </Button>
      </div>

      {/* Quick info bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
              {empresa.ciudad || "—"}, {empresa.departamento || "—"}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4 text-gray-400 shrink-0" />
              {empresa.telefono || "—"}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="truncate">{empresa.correo || "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <UserCircle2 className="w-4 h-4 text-gray-400 shrink-0" />
              {empresa.representante || "—"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="general">
        <TabsList className="bg-white border border-gray-200 shadow-sm p-1 h-auto flex-wrap gap-1">
          <TabsTrigger value="general" className="text-xs gap-1.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Building2 className="w-3.5 h-3.5" />
            Información General
          </TabsTrigger>
          <TabsTrigger value="tributario" className="text-xs gap-1.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <CreditCard className="w-3.5 h-3.5" />
            Tributario
          </TabsTrigger>
          <TabsTrigger value="contable" className="text-xs gap-1.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <BookOpen className="w-3.5 h-3.5" />
            Contable
          </TabsTrigger>
          <TabsTrigger value="accesos" className="text-xs gap-1.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Lock className="w-3.5 h-3.5" />
            Accesos
          </TabsTrigger>
          <TabsTrigger value="obligaciones" className="text-xs gap-1.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <CalendarCheck className="w-3.5 h-3.5" />
            Obligaciones
          </TabsTrigger>
          <TabsTrigger value="historia" className="text-xs gap-1.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <History className="w-3.5 h-3.5" />
            Historia
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Información General ───────────────────────────────────── */}
        <TabsContent value="general" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Datos Básicos</CardTitle>
              <CardDescription>Información de identificación y contacto</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
                <InfoField label="Razón Social" value={empresa.razonSocial} />
                <InfoField label="Nombre Comercial" value={empresa.nombreComercial} />
                <InfoField label="NIT" value={empresa.nit} mono />
                <InfoField label="Dirección" value={empresa.direccion} />
                <InfoField label="Ciudad" value={empresa.ciudad} />
                <InfoField label="Departamento" value={empresa.departamento} />
                <InfoField label="Teléfono" value={empresa.telefono} />
                <InfoField label="Correo Electrónico" value={empresa.correo} />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</p>
                  <Badge
                    variant={empresa.estado === "ACTIVA" ? "success" : "secondary"}
                    className="text-xs"
                  >
                    {empresa.estado}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-50">
                  <UserCircle2 className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Representante Legal</CardTitle>
                  <CardDescription>Persona autorizada para actos jurídicos</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-5">
                <InfoField label="Nombre Completo" value={empresa.representante} />
                <InfoField label="Cédula" value={empresa.repCedula} mono />
                <InfoField label="Correo Electrónico" value={empresa.repCorreo} />
                <InfoField label="Teléfono" value={empresa.repTelefono} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Tributario ───────────────────────────────────────────── */}
        <TabsContent value="tributario" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Información Tributaria</CardTitle>
                  <CardDescription>Clasificación fiscal y obligaciones DIAN</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
                <InfoField label="Régimen Tributario" value={empresa.regimen} />
                <InfoField label="Responsabilidad IVA" value={empresa.responsabilidadIVA} />
                <InfoField label="Tipo de Contribuyente" value={empresa.tipoContribuyente} />
                <InfoField label="Actividad Económica" value={empresa.actividadEconomica} />
                <BooleanField label="Agente Retenedor" value={empresa.agenteRetenedor} />
                <BooleanField label="Obligado a Facturar Electrónicamente" value={empresa.obligadoFacturar} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Contable ─────────────────────────────────────────────── */}
        <TabsContent value="contable" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-50">
                  <BookOpen className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Información Contable</CardTitle>
                  <CardDescription>Software, nómina y configuración</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
                <InfoField label="Software Contable" value={empresa.softwareContable} />
                <InfoField label="Tipo de Nómina" value={empresa.tipoNomina} />
                <InfoField label="Periodicidad Nómina" value={empresa.periodicidadNomina} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Accesos ──────────────────────────────────────────────── */}
        <TabsContent value="accesos" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50">
                  <Lock className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Credenciales y Accesos</CardTitle>
                  <CardDescription>Usuarios, contraseñas y portales</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 mb-4">
                  <Lock className="w-6 h-6 text-slate-400" />
                </div>
                <p className="font-semibold text-gray-600 mb-1">Módulo de Accesos</p>
                <p className="text-sm text-gray-400 max-w-xs">
                  Gestione credenciales de portales de la DIAN, bancos, Seguridad
                  Social y software contable desde el módulo de Accesos.
                </p>
                <Link href="/accesos" className="mt-4">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    Ir a Accesos
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Obligaciones ────────────────────────────────────────── */}
        <TabsContent value="obligaciones" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50">
                    <CalendarCheck className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Obligaciones Tributarias</CardTitle>
                    <CardDescription>
                      Fechas límite para {empresa.razonSocial}
                    </CardDescription>
                  </div>
                </div>
                <Link href={`/calendario?empresa=${encodeURIComponent(empresa.razonSocial)}`}>
                  <Button variant="outline" size="sm" className="text-xs gap-1.5">
                    <CalendarCheck className="w-3.5 h-3.5" />
                    Ver en calendario
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-orange-50 mb-3">
                  <CalendarCheck className="w-5 h-5 text-orange-400" />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Las obligaciones se gestionan desde el Calendario Tributario
                </p>
                <p className="text-xs text-gray-400 max-w-xs">
                  Desde allí puede agregar, editar y hacer seguimiento a cada obligación.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Historia ────────────────────────────────────────────── */}
        <TabsContent value="historia" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100">
                  <History className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Historial de Actividad</CardTitle>
                  <CardDescription>Registro de cambios y eventos de la empresa</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gray-100 mb-3">
                  <History className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-600">Historial no disponible</p>
                <p className="text-xs text-gray-400 mt-1">
                  El registro de actividad estará disponible en una próxima versión.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
