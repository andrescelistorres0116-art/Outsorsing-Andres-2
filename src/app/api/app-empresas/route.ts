import { NextRequest, NextResponse } from "next/server";
import type { EmpresaMock } from "@/lib/empresas-mock";
import { empresaStore } from "@/lib/empresa-store";
import { readStore, writeStore } from "@/lib/persist";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const DATA_FILE = path.join(process.env.DATA_DIR ?? path.join(process.cwd(), ".data"), "empresas.json");

export function GET() {
  // Always read from file to survive hot-reloads and module resets.
  // Return 204 if the file has never been written so the client knows
  // to fall back to localStorage (first-time setup).
  if (!fs.existsSync(DATA_FILE)) {
    return new NextResponse(null, { status: 204 });
  }
  const list = readStore<EmpresaMock[]>("empresas", []);
  empresaStore.list = list;
  return NextResponse.json(list);
}

export async function PUT(req: NextRequest) {
  const list: EmpresaMock[] = await req.json();
  empresaStore.list = list;
  writeStore("empresas", list);
  return NextResponse.json({ ok: true });
}
