import { NextRequest, NextResponse } from "next/server";
import type { EmpresaMock } from "@/lib/empresas-mock";
import { empresaStore } from "@/lib/empresa-store";

export function GET() {
  return NextResponse.json(empresaStore.list);
}

// Bulk replace — admin sends the full list on every save
export async function PUT(req: NextRequest) {
  const list: EmpresaMock[] = await req.json();
  empresaStore.list = list;
  return NextResponse.json({ ok: true });
}
