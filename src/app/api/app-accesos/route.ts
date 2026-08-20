import { NextRequest, NextResponse } from "next/server";
import type { AccesoStored } from "@/lib/acceso-store";
import { accesoStore } from "@/lib/acceso-store";
import { readStore, writeStore } from "@/lib/persist";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const DATA_FILE = path.join(process.env.DATA_DIR ?? path.join(process.cwd(), ".data"), "accesos.json");

export function GET() {
  if (!fs.existsSync(DATA_FILE)) {
    return new NextResponse(null, { status: 204 });
  }
  const list = readStore<AccesoStored[]>("accesos", []);
  accesoStore.list = list;
  return NextResponse.json(list);
}

export async function PUT(req: NextRequest) {
  const list: AccesoStored[] = await req.json();
  accesoStore.list = list;
  writeStore("accesos", list);
  return NextResponse.json({ ok: true });
}
