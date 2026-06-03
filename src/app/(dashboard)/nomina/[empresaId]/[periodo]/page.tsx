"use client";

import { useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Save,
  Send,
  Paperclip,
  Plus,
  Trash2,
  MessageSquare,
  User,
  MapPin,
  ChevronDown,
  PartyPopper,
  AlertCircle,
  Download,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Types ──────────────────────────────────────────────────────────────────────

type EstadoNomina = "BORRADOR" | "ENVIADO" | "REVISADO" | "APROBADO";

type TipoNovedad =
  | "HORAS_EXTRAS"
  | "RECARGOS"
  | "BONIFICACION"
  | "COMISION"
  | "INCAPACIDAD"
  | "LICENCIA"
  | "VACACIONES"
  | "LIBRANZA"
  | "EMBARGO"
  | "INGRESO"
  | "RETIRO"
  | "LLEGADA_TARDE"
  | "AUSENCIA"
  | "OTRA";

interface Novedad {
  id: string;
  tipo: TipoNovedad | "";
  valor: string;
  descripcion: string;
  adjunto?: string;
}

interface Empleado {
  cedula: string;
  nombre: string;
  ciudad: string;
  cargo: string;
  novedades: Novedad[];
}

// ── Constants ──────────────────────────────────────────────────────────────────

const TIPOS_NOVEDAD: { value: TipoNovedad; label: string; unit: string }[] = [
  { value: "HORAS_EXTRAS", label: "Horas Extras", unit: "horas" },
  { value: "RECARGOS", label: "Recargos Nocturnos / Dominicales", unit: "horas" },
  { value: "BONIFICACION", label: "Bonificación", unit: "COP" },
  { value: "COMISION", label: "Comisiones", unit: "COP" },
  { value: "INCAPACIDAD", label: "Incapacidad", unit: "días" },
  { value: "LICENCIA", label: "Licencia", unit: "días" },
  { value: "VACACIONES", label: "Vacaciones", unit: "días" },
  { value: "LIBRANZA", label: "Libranza / Descuento", unit: "COP" },
  { value: "EMBARGO", label: "Embargo Judicial", unit: "COP" },
  { value: "INGRESO", label: "Ingreso (Nuevo Empleado)", unit: "" },
  { value: "RETIRO", label: "Retiro / Liquidación", unit: "" },
  { value: "LLEGADA_TARDE", label: "Llegada Tarde / Atraso", unit: "minutos" },
  { value: "AUSENCIA", label: "Ausencia Injustificada", unit: "días" },
  { value: "OTRA", label: "Otra Novedad", unit: "" },
];

const TIPO_NOVEDAD_COLOR: Record<TipoNovedad, string> = {
  HORAS_EXTRAS: "bg-blue-100 text-blue-700 border-blue-200",
  RECARGOS: "bg-indigo-100 text-indigo-700 border-indigo-200",
  BONIFICACION: "bg-green-100 text-green-700 border-green-200",
  COMISION: "bg-emerald-100 text-emerald-700 border-emerald-200",
  INCAPACIDAD: "bg-yellow-100 text-yellow-700 border-yellow-200",
  LICENCIA: "bg-orange-100 text-orange-700 border-orange-200",
  VACACIONES: "bg-teal-100 text-teal-700 border-teal-200",
  LIBRANZA: "bg-purple-100 text-purple-700 border-purple-200",
  EMBARGO: "bg-red-100 text-red-700 border-red-200",
  INGRESO: "bg-cyan-100 text-cyan-700 border-cyan-200",
  RETIRO: "bg-rose-100 text-rose-700 border-rose-200",
  LLEGADA_TARDE: "bg-amber-100 text-amber-700 border-amber-200",
  AUSENCIA: "bg-gray-100 text-gray-700 border-gray-200",
  OTRA: "bg-slate-100 text-slate-700 border-slate-200",
};

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// ── Mock Employees for 300 HILOS SAS ──────────────────────────────────────────

const EMPLEADOS_300HILOS: Omit<Empleado, "novedades">[] = [
  { cedula: "52.107.968", nombre: "DÍAZ MONTERROSO LUZ MARINA", ciudad: "Bogotá", cargo: "Auxiliar Contable" },
  { cedula: "1.015.419.117", nombre: "COLÓN TORRES ANDRÉS FELIPE", ciudad: "Bogotá", cargo: "Auxiliar de Producción" },
  { cedula: "1.015.623.808", nombre: "MELO FONSECA ETA VANESSA", ciudad: "Bogotá", cargo: "Operaria de Confección" },
  { cedula: "79.854.321", nombre: "PARRA RODRÍGUEZ HENRY AUGUSTO", ciudad: "Bogotá", cargo: "Supervisor de Planta" },
  { cedula: "1.020.789.456", nombre: "SUÁREZ GÓMEZ LINA MARCELA", ciudad: "Bogotá", cargo: "Diseñadora Textil" },
  { cedula: "52.448.721", nombre: "BERMÚDEZ ORTIZ CARMEN ROSA", ciudad: "Bogotá", cargo: "Cortadora" },
  { cedula: "1.032.456.789", nombre: "TORRES ÁVILA JUAN SEBASTIÁN", ciudad: "Soacha", cargo: "Operario de Maquinaria" },
  { cedula: "41.657.893", nombre: "NIÑO VARGAS GLORIA PATRICIA", ciudad: "Bogotá", cargo: "Coordinadora de Calidad" },
  { cedula: "1.019.087.234", nombre: "CÁRDENAS MORA DIEGO ALEJANDRO", ciudad: "Bogotá", cargo: "Mensajero" },
  { cedula: "52.891.045", nombre: "HERRERA SALCEDO ANA LUCÍA", ciudad: "Bogotá", cargo: "Recepcionista" },
];

const EMPLEADOS_GENERIC: Omit<Empleado, "novedades">[] = [
  { cedula: "12.345.678", nombre: "RAMÍREZ PÉREZ CARLOS ANDRES", ciudad: "Bogotá", cargo: "Gerente General" },
  { cedula: "45.678.901", nombre: "SILVA CASTRO MARTHA ELENA", ciudad: "Bogotá", cargo: "Contadora" },
  { cedula: "78.901.234", nombre: "MORALES JIMÉNEZ PEDRO PABLO", ciudad: "Bogotá", cargo: "Vendedor" },
  { cedula: "23.456.789", nombre: "GUERRERO ZAPATA ROSA ALBA", ciudad: "Bogotá", cargo: "Asistente Administrativo" },
  { cedula: "56.789.012", nombre: "LUNA VARGAS OSCAR IVÁN", ciudad: "Bogotá", cargo: "Técnico" },
];

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

// Sample pre-filled novelties for 300 HILOS primera quincena
function buildEmpleados(empresaId: string): Empleado[] {
  const base = empresaId === "300-hilos" ? EMPLEADOS_300HILOS : EMPLEADOS_GENERIC;

  return base.map((emp, i) => {
    let novedades: Novedad[] = [];

    if (empresaId === "300-hilos") {
      if (i === 0) {
        // Horas extras
        novedades = [
          {
            id: makeId(),
            tipo: "HORAS_EXTRAS",
            valor: "6",
            descripcion: "Horas extras trabajadas del 1 al 5 de junio por cierre de período.",
            adjunto: undefined,
          },
        ];
      } else if (i === 2) {
        // Incapacidad
        novedades = [
          {
            id: makeId(),
            tipo: "INCAPACIDAD",
            valor: "4",
            descripcion: "Incapacidad médica del 3 al 6 de junio. EPS Sura.",
            adjunto: undefined,
          },
        ];
      } else if (i === 4) {
        // Vacaciones
        novedades = [
          {
            id: makeId(),
            tipo: "VACACIONES",
            valor: "7",
            descripcion: "Vacaciones aprobadas del 8 al 14 de junio.",
            adjunto: undefined,
          },
        ];
      } else if (i === 7) {
        // Horas extras
        novedades = [
          {
            id: makeId(),
            tipo: "HORAS_EXTRAS",
            valor: "4",
            descripcion: "Horas extras por inventario semestral.",
            adjunto: undefined,
          },
        ];
      }
    }

    return { ...emp, novedades };
  });
}

// ── Estado config ──────────────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<
  EstadoNomina,
  { label: string; className: string }
> = {
  BORRADOR: { label: "Borrador", className: "bg-gray-100 text-gray-700 border-gray-300" },
  ENVIADO: { label: "Enviado", className: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  REVISADO: { label: "En Revisión", className: "bg-blue-100 text-blue-700 border-blue-300" },
  APROBADO: { label: "Aprobado", className: "bg-green-100 text-green-700 border-green-300" },
};

// ── Page ───────────────────────────────────────────────────────────────────────

export default function NominaDetallePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const empresaId = params.empresaId as string;
  const periodoParam = params.periodo as string;
  const mes = parseInt(searchParams.get("mes") ?? "6");
  const anio = parseInt(searchParams.get("anio") ?? "2026");
  const empresaNombre = searchParams.get("empresa")
    ? decodeURIComponent(searchParams.get("empresa")!)
    : empresaId === "300-hilos"
    ? "300 HILOS SAS"
    : empresaId.toUpperCase();

  const periodoLabel = periodoParam === "1-15" ? "Primera Quincena" : "Segunda Quincena";
  const titulo = `${empresaNombre} — ${periodoLabel} ${MESES[mes - 1]} ${anio}`;

  const [estado, setEstado] = useState<EstadoNomina>("ENVIADO");
  const [empleados, setEmpleados] = useState<Empleado[]>(() => buildEmpleados(empresaId));
  const [comentarios, setComentarios] = useState("");
  const [sinNovedades, setSinNovedades] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sent, setSent] = useState(false);
  const [novedadExpandida, setNovedadExpandida] = useState<string | null>(null);

  const totalNovedades = empleados.reduce((sum, e) => sum + e.novedades.length, 0);
  const empleadosConNovedades = empleados.filter((e) => e.novedades.length > 0).length;

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleConfirmarSinNovedades = () => {
    setSinNovedades(true);
    setEmpleados((prev) => prev.map((e) => ({ ...e, novedades: [] })));
    setEstado("ENVIADO");
  };

  const handleAgregarNovedad = (cedula: string) => {
    setEmpleados((prev) =>
      prev.map((e) =>
        e.cedula === cedula
          ? {
              ...e,
              novedades: [
                ...e.novedades,
                { id: makeId(), tipo: "", valor: "", descripcion: "", adjunto: undefined },
              ],
            }
          : e
      )
    );
    setSinNovedades(false);
  };

  const handleUpdateNovedad = (
    cedula: string,
    novedadId: string,
    field: keyof Novedad,
    value: string
  ) => {
    setEmpleados((prev) =>
      prev.map((e) =>
        e.cedula === cedula
          ? {
              ...e,
              novedades: e.novedades.map((n) =>
                n.id === novedadId ? { ...n, [field]: value } : n
              ),
            }
          : e
      )
    );
    setSinNovedades(false);
  };

  const handleEliminarNovedad = (cedula: string, novedadId: string) => {
    setEmpleados((prev) =>
      prev.map((e) =>
        e.cedula === cedula
          ? { ...e, novedades: e.novedades.filter((n) => n.id !== novedadId) }
          : e
      )
    );
  };

  const handleAdjunto = (cedula: string, novedadId: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.jpg,.jpeg,.png,.doc,.docx";
    input.onchange = (ev) => {
      const file = (ev.target as HTMLInputElement).files?.[0];
      if (file) {
        handleUpdateNovedad(cedula, novedadId, "adjunto", file.name);
      }
    };
    input.click();
  };

  const handleGuardar = useCallback(() => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }, []);

  const handleEnviar = useCallback(() => {
    setEstado("ENVIADO");
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  }, []);

  const estadoCfg = ESTADO_CONFIG[estado];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mt-0.5 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{titulo}</h1>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${estadoCfg.className}`}
              >
                {estadoCfg.label}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {empleados.length} empleados &middot; {empleadosConNovedades} con novedades &middot;{" "}
              {totalNovedades} novedad{totalNovedades !== 1 ? "es" : ""} registrada
              {totalNovedades !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-gray-600"
            onClick={handleGuardar}
          >
            {saved ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-green-600">Guardado</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Borrador
              </>
            )}
          </Button>
          <Button
            size="sm"
            className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={handleEnviar}
          >
            {sent ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Enviado!
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Enviar a Revisión
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Sin Novedades Quick Action */}
      {!sinNovedades ? (
        <Card className="border-2 border-dashed border-green-300 bg-green-50/40 hover:border-green-400 hover:bg-green-50 transition-all">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-100">
                  <PartyPopper className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-base font-semibold text-green-800">
                    Sin novedades en esta quincena
                  </p>
                  <p className="text-sm text-green-600 mt-0.5">
                    Si no hubo cambios para ningún empleado, confirma aquí para agilizar el proceso.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleConfirmarSinNovedades}
                className="bg-green-600 hover:bg-green-700 text-white gap-2 shrink-0 px-6"
              >
                <CheckCircle2 className="w-4 h-4" />
                Esta quincena no hubo novedades — Confirmar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 border-green-400 bg-green-50">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-800">
                Confirmado: Sin novedades en esta quincena
              </p>
              <p className="text-xs text-green-600 mt-0.5">
                El reporte ha sido marcado como sin novedades. Puedes agregar novedades individuales si es necesario.
              </p>
            </div>
            <button
              onClick={() => setSinNovedades(false)}
              className="text-xs text-green-700 underline hover:text-green-900 shrink-0"
            >
              Deshacer
            </button>
          </CardContent>
        </Card>
      )}

      {/* Info Banner */}
      <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
        <AlertCircle className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
        <p className="text-sm text-indigo-700">
          Registra las novedades de cada empleado para esta quincena. Haz clic en{" "}
          <span className="font-semibold">+ Agregar Novedad</span> junto a cada empleado.
          Puedes adjuntar soportes (incapacidades, contratos, etc.).
        </p>
      </div>

      {/* Employees Table */}
      <div className="space-y-3">
        {empleados.map((empleado) => (
          <EmpleadoRow
            key={empleado.cedula}
            empleado={empleado}
            expandido={novedadExpandida === empleado.cedula}
            onToggleExpand={() =>
              setNovedadExpandida((prev) =>
                prev === empleado.cedula ? null : empleado.cedula
              )
            }
            onAgregarNovedad={() => handleAgregarNovedad(empleado.cedula)}
            onUpdateNovedad={(nId, field, val) =>
              handleUpdateNovedad(empleado.cedula, nId, field, val)
            }
            onEliminarNovedad={(nId) => handleEliminarNovedad(empleado.cedula, nId)}
            onAdjunto={(nId) => handleAdjunto(empleado.cedula, nId)}
          />
        ))}
      </div>

      {/* Comments */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700">
              Comentarios del período
            </h3>
            <span className="text-xs text-gray-400">(opcional)</span>
          </div>
          <Textarea
            placeholder="Observaciones generales del período, instrucciones especiales para el contador, o cualquier novedad adicional que no esté en la tabla..."
            value={comentarios}
            onChange={(e) => setComentarios(e.target.value)}
            rows={3}
            className="resize-none text-sm"
          />
        </CardContent>
      </Card>

      {/* Bottom Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4">
        <button
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          onClick={() => {/* export logic */}}
        >
          <Download className="w-4 h-4" />
          Descargar reporte en PDF
        </button>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleGuardar}>
            <Save className="w-4 h-4" />
            Guardar Borrador
          </Button>
          <Button
            size="sm"
            className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-6"
            onClick={handleEnviar}
          >
            <Send className="w-4 h-4" />
            Enviar a Revisión
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Empleado Row ───────────────────────────────────────────────────────────────

interface EmpleadoRowProps {
  empleado: Empleado;
  expandido: boolean;
  onToggleExpand: () => void;
  onAgregarNovedad: () => void;
  onUpdateNovedad: (novedadId: string, field: keyof Novedad, value: string) => void;
  onEliminarNovedad: (novedadId: string) => void;
  onAdjunto: (novedadId: string) => void;
}

function EmpleadoRow({
  empleado,
  expandido,
  onToggleExpand,
  onAgregarNovedad,
  onUpdateNovedad,
  onEliminarNovedad,
  onAdjunto,
}: EmpleadoRowProps) {
  const tieneNovedades = empleado.novedades.length > 0;

  return (
    <Card
      className={`transition-all duration-200 ${
        tieneNovedades
          ? "border-indigo-200 shadow-sm"
          : "border-gray-200"
      }`}
    >
      {/* Employee Header Row */}
      <button
        className="w-full text-left"
        onClick={onToggleExpand}
        type="button"
      >
        <div className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50/60 transition-colors rounded-xl">
          {/* Avatar */}
          <div
            className={`flex items-center justify-center w-9 h-9 rounded-full shrink-0 ${
              tieneNovedades ? "bg-indigo-100" : "bg-gray-100"
            }`}
          >
            <User className={`w-4 h-4 ${tieneNovedades ? "text-indigo-600" : "text-gray-400"}`} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-900">{empleado.nombre}</span>
              {tieneNovedades && (
                <span className="inline-flex items-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-0.5 border border-indigo-200">
                  {empleado.novedades.length} novedad{empleado.novedades.length !== 1 ? "es" : ""}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
              <span className="font-mono">{empleado.cedula}</span>
              <span className="flex items-center gap-0.5">
                <MapPin className="w-3 h-3" />
                {empleado.ciudad}
              </span>
              <span>{empleado.cargo}</span>
            </div>
          </div>

          {/* Novedades summary chips */}
          <div className="hidden sm:flex items-center gap-1.5 flex-wrap max-w-xs">
            {empleado.novedades.slice(0, 2).map((n) => {
              if (!n.tipo) return null;
              const cfg = TIPOS_NOVEDAD.find((t) => t.value === n.tipo);
              const colorClass = TIPO_NOVEDAD_COLOR[n.tipo as TipoNovedad];
              return (
                <span
                  key={n.id}
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${colorClass}`}
                >
                  {cfg?.label ?? n.tipo}
                </span>
              );
            })}
            {empleado.novedades.length > 2 && (
              <span className="text-xs text-gray-400">
                +{empleado.novedades.length - 2} más
              </span>
            )}
            {!tieneNovedades && (
              <span className="text-xs text-gray-400 italic">Sin novedades</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAgregarNovedad();
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar Novedad
            </button>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                expandido ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>
      </button>

      {/* Novedades Detail (expanded) */}
      {(expandido || tieneNovedades) && empleado.novedades.length > 0 && (
        <div className="border-t border-gray-100 px-5 pb-4 pt-3">
          <div className="space-y-3">
            {empleado.novedades.map((novedad, nIdx) => (
              <NovedadEditRow
                key={novedad.id}
                novedad={novedad}
                index={nIdx}
                onUpdate={(field, val) => onUpdateNovedad(novedad.id, field, val)}
                onEliminar={() => onEliminarNovedad(novedad.id)}
                onAdjunto={() => onAdjunto(novedad.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state when expanded but no novedades */}
      {expandido && !tieneNovedades && (
        <div className="border-t border-gray-100 px-5 pb-4 pt-3">
          <div className="text-center py-4">
            <p className="text-sm text-gray-400">No hay novedades registradas para este empleado</p>
            <button
              type="button"
              onClick={onAgregarNovedad}
              className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-2"
            >
              + Agregar primera novedad
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

// ── Novedad Edit Row ───────────────────────────────────────────────────────────

interface NovedadEditRowProps {
  novedad: Novedad;
  index: number;
  onUpdate: (field: keyof Novedad, value: string) => void;
  onEliminar: () => void;
  onAdjunto: () => void;
}

function NovedadEditRow({ novedad, index, onUpdate, onEliminar, onAdjunto }: NovedadEditRowProps) {
  const tipoInfo = TIPOS_NOVEDAD.find((t) => t.value === novedad.tipo);
  const colorClass = novedad.tipo ? TIPO_NOVEDAD_COLOR[novedad.tipo as TipoNovedad] : "";

  return (
    <div className="flex flex-col sm:flex-row gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
      {/* Index */}
      <div className="flex items-start pt-1 shrink-0">
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
          {index + 1}
        </span>
      </div>

      {/* Fields */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-2.5">
        {/* Tipo */}
        <div className="sm:col-span-4">
          <label className="text-xs font-medium text-gray-500 mb-1 block">Tipo de Novedad</label>
          <Select value={novedad.tipo} onValueChange={(v) => onUpdate("tipo", v)}>
            <SelectTrigger className="h-8 text-xs bg-white">
              <SelectValue placeholder="Seleccionar tipo..." />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_NOVEDAD.map((t) => (
                <SelectItem key={t.value} value={t.value} className="text-xs">
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {novedad.tipo && (
            <span className={`inline-flex mt-1 items-center rounded-full border px-2 py-0.5 text-xs font-medium ${colorClass}`}>
              {tipoInfo?.label}
            </span>
          )}
        </div>

        {/* Valor */}
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-gray-500 mb-1 block">
            Valor {tipoInfo?.unit ? `(${tipoInfo.unit})` : ""}
          </label>
          <Input
            value={novedad.valor}
            onChange={(e) => onUpdate("valor", e.target.value)}
            placeholder={tipoInfo?.unit ?? "—"}
            className="h-8 text-xs bg-white"
          />
        </div>

        {/* Descripción */}
        <div className="sm:col-span-6">
          <label className="text-xs font-medium text-gray-500 mb-1 block">Descripción</label>
          <Input
            value={novedad.descripcion}
            onChange={(e) => onUpdate("descripcion", e.target.value)}
            placeholder="Describe la novedad brevemente..."
            className="h-8 text-xs bg-white"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex sm:flex-col items-center gap-1.5 pt-0 sm:pt-5 shrink-0">
        <button
          type="button"
          onClick={onAdjunto}
          title="Adjuntar soporte"
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            novedad.adjunto
              ? "bg-green-50 text-green-700 border border-green-300"
              : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-100"
          }`}
        >
          <Paperclip className="w-3.5 h-3.5" />
          {novedad.adjunto ? (
            <span className="max-w-[80px] truncate">{novedad.adjunto}</span>
          ) : (
            "Adjuntar"
          )}
        </button>
        <button
          type="button"
          onClick={onEliminar}
          title="Eliminar novedad"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white text-red-400 border border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Quitar
        </button>
      </div>
    </div>
  );
}
