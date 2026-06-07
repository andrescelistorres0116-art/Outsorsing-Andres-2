import { NextRequest, NextResponse } from "next/server";
import { novedadesStore, NovedadIngreso } from "@/lib/novedades-store";

export function GET() {
  return NextResponse.json(novedadesStore.list);
}

export async function POST(req: NextRequest) {
  const novedad: NovedadIngreso = await req.json();
  novedadesStore.list = [...novedadesStore.list, novedad];
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest) {
  const list: NovedadIngreso[] = await req.json();
  novedadesStore.list = list;
  return NextResponse.json({ ok: true });
}
