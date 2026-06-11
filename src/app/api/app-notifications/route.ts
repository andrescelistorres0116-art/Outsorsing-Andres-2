import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

function cuandoLabel(diff: number): string {
  if (diff === 0) return "hoy";
  if (diff === 1) return "mañana";
  return `en ${diff} días`;
}

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json([], { status: 200 }); // silently return empty for unauthenticated

  const notifications: AppNotification[] = [];
  const now = startOfDay(new Date());
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + 5);

  // ── 1. Obligaciones del calendario — solo empresas ACTIVAS ─────────────────
  try {
    const obligaciones = await prisma.obligacionTributaria.findMany({
      where: {
        estado: { notIn: ["PAGADO", "PRESENTADO"] },
        fechaVencimiento: { gte: now, lte: horizon },
        empresa: { estado: "ACTIVA" },
      },
      select: {
        id: true,
        tipoObligacion: true,
        fechaVencimiento: true,
        empresa: { select: { razonSocial: true } },
      },
      orderBy: { fechaVencimiento: "asc" },
    });

    for (const ob of obligaciones) {
      const diff = Math.round(
        (startOfDay(ob.fechaVencimiento).getTime() - now.getTime()) / 86_400_000
      );
      notifications.push({
        id: `ob-${ob.id}`,
        tipo: "obligacion",
        title: "Obligación próxima",
        message: `${ob.tipoObligacion} vence ${cuandoLabel(diff)} — ${ob.empresa.razonSocial}`,
        diasRestantes: diff,
      });
    }
  } catch {
    // DB not available — skip calendar notifications
  }

  // ── 2. Vencimientos de nómina — solo empresas ACTIVAS con nómina ───────────
  try {
    const empresasConNomina = await prisma.empresa.findMany({
      where: {
        estado: "ACTIVA",
        periodicidadNomina: { not: null },
      },
      select: {
        id: true,
        razonSocial: true,
        periodicidadNomina: true,
      },
    });

    const year = now.getFullYear();
    const month = now.getMonth(); // 0-based

    const addNominaAlerts = (
      day: number,
      periodoLabel: string,
      periodicidades: string[]
    ) => {
      const deadline = startOfDay(new Date(year, month, day));
      const diff = Math.round(
        (deadline.getTime() - now.getTime()) / 86_400_000
      );
      if (diff < 0 || diff > 5) return;
      for (const emp of empresasConNomina) {
        const p = emp.periodicidadNomina ?? "";
        if (periodicidades.includes(p)) {
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

    // 1ra quincena y mensual vencen el 15 · 2da quincena vence el 30
    addNominaAlerts(15, "1ra quincena", ["QUINCENAL", "MENSUAL"]);
    addNominaAlerts(30, "2da quincena", ["QUINCENAL"]);
  } catch {
    // DB not available — skip nomina notifications
  }

  notifications.sort((a, b) => a.diasRestantes - b.diasRestantes);
  return NextResponse.json(notifications);
}
