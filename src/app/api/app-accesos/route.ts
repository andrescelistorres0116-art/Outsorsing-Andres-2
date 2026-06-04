import { NextRequest, NextResponse } from "next/server";
import type { AccesoStored } from "@/lib/acceso-store";
import { accesoStore } from "@/lib/acceso-store";
import { writeStore } from "@/lib/persist";

export function GET() {
  return NextResponse.json(accesoStore.list);
}

export async function PUT(req: NextRequest) {
  const list: AccesoStored[] = await req.json();
  accesoStore.list = list;
  writeStore("accesos", list);
  return NextResponse.json({ ok: true });
}
