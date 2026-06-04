import { NextResponse } from "next/server";
import { OBLIGACIONES_MOCK } from "@/components/calendario/mockData";
import { empresaStore } from "@/lib/empresa-store";
import { EMPRESAS_MOCK } from "@/lib/empresas-mock";

export interface AppNotification {
  id: string;
  tipo: "obligacion" | "nomina";
  title: string;
  message: string;
  diasRestantes: number;
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function diffDays(fechaStr: string, now: Date): number {
  const fecha = startOfDay(new Date(fechaStr + "T00:00:00"));
  return Math.round((fecha.getTime() - now.getTime()) / 86_400_000);
}

function cuandoLabel(diff: number): string {
  if (diff === 0) return "hoy";
  if (diff === 1) return "mañana";
  return `en ${diff} días`;
}

export function GET() {
  const notifications: AppNotification[] = [];
  const now = startOfDay(new Date());

  // ── 1. Obligaciones del calendario con vencimiento en los próximos 5 días ──
  for (const ob of OBLIGACIONES_MOCK) {
    if (ob.estado === "PAGADO" || ob.estado === "PRESENTADO") continue;
    const diff = diffDays(ob.fechaVencimiento, now);
    if (diff >= 0 && diff <= 5) {
      notifications.push({
        id: `ob-${ob.id}`,
        tipo: "obligacion",
        title: "Obligación próxima",
        message: `${ob.tipoObligacion} vence ${cuandoLabel(diff)} — ${ob.empresa}`,
        diasRestantes: diff,
      });
    }
  }

  // ── 2. Vencimientos de nómina ──────────────────────────────────────────────
  // 1ra quincena y mensual vencen el 15 · 2da quincena vence el 30
  const empresas =
    empresaStore.list.length > 0 ? empresaStore.list : EMPRESAS_MOCK;

  const activas = empresas.filter(
    (e) =>
      e.periodicidadNomina &&
      e.periodicidadNomina !== "no_aplica" &&
      e.estado === "ACTIVA"
  );

  const year = now.getFullYear();
  const month = now.getMonth(); // 0-based

  const addNominaAlerts = (
    day: number,
    periodoLabel: string,
    tipos: string[]
  ) => {
    const deadline = startOfDay(new Date(year, month, day));
    const diff = Math.round(
      (deadline.getTime() - now.getTime()) / 86_400_000
    );
    if (diff < 0 || diff > 5) return;
    for (const emp of activas) {
      if (tipos.includes(emp.periodicidadNomina!)) {
        notifications.push({
          id: `nom-${emp.id}-${periodoLabel}-${year}-${month + 1}`,
          tipo: "nomina",
          title: "Nómina por reportar",
          message: `Nómina ${periodoLabel} vence ${cuandoLabel(diff)} — ${emp.razonSocial}`,
          diasRestantes: diff,
        });
      }
    }
  };

  addNominaAlerts(15, "1ra quincena", ["quincenal", "mensual"]);
  addNominaAlerts(30, "2da quincena", ["quincenal"]);

  // Ordenar por urgencia (menos días primero)
  notifications.sort((a, b) => a.diasRestantes - b.diasRestantes);

  return NextResponse.json(notifications);
}
