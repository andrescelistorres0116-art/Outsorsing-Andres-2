import { NextRequest, NextResponse } from "next/server";
import type { EmpresaMock } from "@/lib/empresas-mock";
import { empresaStore } from "@/lib/empresa-store";
import { writeStore } from "@/lib/persist";

export function GET() {
  return NextResponse.json(empresaStore.list);
}

export async function PUT(req: NextRequest) {
  const list: EmpresaMock[] = await req.json();
  empresaStore.list = list;
  writeStore("empresas", list);
  return NextResponse.json({ ok: true });
}
