import { NextRequest, NextResponse } from "next/server";
import { novedadesStore, NovedadIngreso } from "@/lib/novedades-store";
import { readStore, writeStore } from "@/lib/persist";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const DATA_FILE = path.join(process.env.DATA_DIR ?? path.join(process.cwd(), ".data"), "novedades.json");

export function GET() {
  if (!fs.existsSync(DATA_FILE)) {
    return NextResponse.json([]);
  }
  const list = readStore<NovedadIngreso[]>("novedades", []);
  novedadesStore.list = list;
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const novedad: NovedadIngreso = await req.json();
  novedadesStore.list = [...novedadesStore.list, novedad];
  writeStore("novedades", novedadesStore.list);
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest) {
  const list: NovedadIngreso[] = await req.json();
  novedadesStore.list = list;
  writeStore("novedades", list);
  return NextResponse.json({ ok: true });
}
