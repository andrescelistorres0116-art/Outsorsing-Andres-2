"use client";

import { use } from "react";
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
  FileText,
  CalendarCheck,
  History,
  Lock,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  Clock,
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

// ── Mock detail data ───────────────────────────────────────────────────────────

const EMPRESA_DETAIL: Record<string, {
  id: number;
  razonSocial: string;
  nombreComercial: string;
  nit: string;
  dv: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  telefono: string;
  correo: string;
  estado: "ACTIVA" | "INACTIVA";
  representante: {
    nombre: string;
    cedula: string;
    correo: string;
    telefono: string;
  };
  tributario: {
    regimen: string;
    responsabilidadIVA: string;
    actividadEconomica: string;
    codigoCIIU: string;
    agenteRetenedor: boolean;
    obligadoFacturar: boolean;
    tipoContribuyente: string;
    resolucionFacturacion: string;
    vencimientoResolucion: string;
  };
  contable: {
    softwareContable: string;
    tipoNomina: string;
    periodicidadNomina: string;
    facturacionElectronica: boolean;
    planContable: string;
  };
  obligaciones: Array<{
    id: number;
    nombre: string;
    periodicidad: string;
    vence: string;
    dias: number;
    estado: string;
  }>;
}> = {
  "1": {
    id: 1,
    razonSocial: "X TOURS SAS",
    nombreComercial: "X Tours",
    nit: "901234567",
    dv: "8",
    direccion: "Cra 15 # 93-75 Piso 4",
    ciudad: "Bogotá",
    departamento: "Cundinamarca",
    telefono: "601 320 4500",
    correo: "contabilidad@xtours.co",
    estado: "ACTIVA",
    representante: {
      nombre: "Carlos Ramírez Mora",
      cedula: "79.845.321",
      correo: "cramirez@xtours.co",
      telefono: "310 550 4400",
    },
    tributario: {
      regimen: "Régimen Ordinario",
      responsabilidadIVA: "Responsable del IVA (Régimen Común)",
      actividadEconomica: "Agencias de viajes y operadores turísticos",
      codigoCIIU: "7911",
      agenteRetenedor: true,
      obligadoFacturar: true,
      tipoContribuyente: "Persona Jurídica",
      resolucionFacturacion: "18764066978920",
      vencimientoResolucion: "31/12/2027",
    },
    contable: {
      softwareContable: "Siigo Nube",
      tipoNomina: "Nómina Electrónica DIAN",
      periodicidadNomina: "Quincenal",
      facturacionElectronica: true,
      planContable: "PUC Estándar NIIF PyMES",
    },
    obligaciones: [
      { id: 1, nombre: "Retención en la Fuente", periodicidad: "Mensual", vence: "08/06/2026", dias: 5, estado: "naranja" },
      { id: 2, nombre: "IVA Bimestral", periodicidad: "Bimestral", vence: "15/08/2026", dias: 73, estado: "verde" },
      { id: 3, nombre: "Declaración Renta", periodicidad: "Anual", vence: "10/04/2027", dias: 311, estado: "verde" },
      { id: 4, nombre: "ICA Bogotá", periodicidad: "Anual", vence: "15/03/2027", dias: 285, estado: "verde" },
      { id: 5, nombre: "Nómina Electrónica", periodicidad: "Quincenal", vence: "25/06/2026", dias: 22, estado: "verde" },
    ],
  },
};

// Fallback data for any ID not in the map
const FALLBACK_EMPRESA = EMPRESA_DETAIL["1"];

// ── Helpers ────────────────────────────────────────────────────────────────────

function InfoField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-medium text-gray-900 ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </p>
    </div>
  );
}

function BooleanField({ label, value }: { label: string; value: boolean }) {
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

function getDiasBadge(dias: number, estado: string) {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border";
  if (estado === "rojo" || dias <= 3)
    return <span className={`${base} bg-red-100 text-red-800 border-red-200`}>{dias}d</span>;
  if (estado === "naranja" || dias <= 7)
    return <span className={`${base} bg-orange-100 text-orange-800 border-orange-200`}>{dias}d</span>;
  if (estado === "amarillo" || dias <= 14)
    return <span className={`${base} bg-yellow-100 text-yellow-800 border-yellow-200`}>{dias}d</span>;
  return <span className={`${base} bg-green-100 text-green-800 border-green-200`}>{dias}d</span>;
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function EmpresaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const empresa = EMPRESA_DETAIL[id] ?? { ...FALLBACK_EMPRESA, id: parseInt(id) };

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
                NIT {empresa.nit}-{empresa.dv}
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
              {empresa.ciudad}, {empresa.departamento}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4 text-gray-400 shrink-0" />
              {empresa.telefono}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="truncate">{empresa.correo}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <UserCircle2 className="w-4 h-4 text-gray-400 shrink-0" />
              {empresa.representante.nombre}
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
              <CardDescription>
                Información de identificación y contacto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
                <InfoField label="Razón Social" value={empresa.razonSocial} />
                <InfoField label="Nombre Comercial" value={empresa.nombreComercial} />
                <InfoField label="NIT" value={`${empresa.nit}-${empresa.dv}`} mono />
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

          {/* Representante Legal */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-50">
                  <UserCircle2 className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Representante Legal</CardTitle>
                  <CardDescription>
                    Persona autorizada para actos jurídicos
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-5">
                <InfoField label="Nombre Completo" value={empresa.representante.nombre} />
                <InfoField label="Cédula" value={empresa.representante.cedula} mono />
                <InfoField label="Correo Electrónico" value={empresa.representante.correo} />
                <InfoField label="Teléfono" value={empresa.representante.telefono} />
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
                  <CardDescription>
                    Clasificación fiscal y obligaciones DIAN
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
                <InfoField label="Régimen Tributario" value={empresa.tributario.regimen} />
                <InfoField label="Responsabilidad IVA" value={empresa.tributario.responsabilidadIVA} />
                <InfoField label="Tipo de Contribuyente" value={empresa.tributario.tipoContribuyente} />
                <InfoField label="Actividad Económica" value={empresa.tributario.actividadEconomica} />
                <InfoField label="Código CIIU" value={empresa.tributario.codigoCIIU} mono />
                <div />
                <BooleanField label="Agente Retenedor" value={empresa.tributario.agenteRetenedor} />
                <BooleanField label="Obligado a Facturar Electrónicamente" value={empresa.tributario.obligadoFacturar} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resolución de Facturación</CardTitle>
              <CardDescription>Datos de habilitación DIAN</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
                <InfoField label="Número de Resolución" value={empresa.tributario.resolucionFacturacion} mono />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Fecha Vencimiento
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-900">
                      {empresa.tributario.vencimientoResolucion}
                    </span>
                  </div>
                </div>
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
                <InfoField label="Software Contable" value={empresa.contable.softwareContable} />
                <InfoField label="Plan Contable" value={empresa.contable.planContable} />
                <BooleanField label="Facturación Electrónica" value={empresa.contable.facturacionElectronica} />
                <InfoField label="Tipo de Nómina" value={empresa.contable.tipoNomina} />
                <InfoField label="Periodicidad Nómina" value={empresa.contable.periodicidadNomina} />
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
                  <CardDescription>
                    Usuarios, contraseñas y portales
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 mb-4">
                  <Lock className="w-6 h-6 text-slate-400" />
                </div>
                <p className="font-semibold text-gray-600 mb-1">
                  Módulo de Accesos
                </p>
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
                      Próximas fechas límite para {empresa.razonSocial}
                    </CardDescription>
                  </div>
                </div>
                <Link href={`/calendario?empresa=${empresa.id}`}>
                  <Button variant="outline" size="sm" className="text-xs gap-1.5">
                    <CalendarCheck className="w-3.5 h-3.5" />
                    Ver calendario completo
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Obligación
                    </th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Periodicidad
                    </th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Vence
                    </th>
                    <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Días
                    </th>
                    <th className="text-right px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {empresa.obligaciones.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="font-medium text-gray-900 text-xs">{o.nombre}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2.5 py-0.5">
                          {o.periodicidad}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-600">{o.vence}</td>
                      <td className="px-4 py-4 text-center">
                        {getDiasBadge(o.dias, o.estado)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {o.estado === "rojo" && (
                          <span className="inline-flex items-center gap-1 text-xs text-red-700">
                            <AlertTriangle className="w-3.5 h-3.5" /> Vencida
                          </span>
                        )}
                        {o.estado === "naranja" && (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
                            Urgente
                          </span>
                        )}
                        {(o.estado === "amarillo" || o.estado === "verde") && (
                          <span className="inline-flex items-center gap-1 text-xs text-green-700">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Al día
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  <CardDescription>
                    Registro de cambios y eventos de la empresa
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                {[
                  {
                    texto: "Declaración IVA bimestral radicada exitosamente",
                    fecha: "02/06/2026 · 10:32 am",
                    tipo: "success",
                    autor: "Admin",
                  },
                  {
                    texto: "Datos de representante legal actualizados",
                    fecha: "18/05/2026 · 3:15 pm",
                    tipo: "info",
                    autor: "Admin",
                  },
                  {
                    texto: "Retención en la fuente radicada — abril 2026",
                    fecha: "07/05/2026 · 9:44 am",
                    tipo: "success",
                    autor: "Admin",
                  },
                  {
                    texto: "Resolución de facturación actualizada (vence dic 2027)",
                    fecha: "15/04/2026 · 11:00 am",
                    tipo: "info",
                    autor: "Admin",
                  },
                  {
                    texto: "Empresa registrada en el sistema Outsoursing Andrés",
                    fecha: "10/01/2025 · 9:00 am",
                    tipo: "info",
                    autor: "Admin",
                  },
                ].map((item, idx, arr) => {
                  const dotColor =
                    item.tipo === "success" ? "bg-green-500" : "bg-blue-500";
                  return (
                    <div key={idx} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${dotColor}`} />
                        {idx < arr.length - 1 && (
                          <div className="w-px flex-1 bg-gray-100 my-1" />
                        )}
                      </div>
                      <div className="pb-5 flex-1 min-w-0">
                        <p className="text-sm text-gray-800 font-medium leading-snug">
                          {item.texto}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {item.fecha} · {item.autor}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
