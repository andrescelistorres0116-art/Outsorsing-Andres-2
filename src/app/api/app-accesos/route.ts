import { NextRequest, NextResponse } from "next/server";
import type { AccesoStored } from "@/lib/acceso-store";
import { accesoStore } from "@/lib/acceso-store";

export function GET() {
  return NextResponse.json(accesoStore.list);
}

// Bulk replace — page sends the full list on every change
export async function PUT(req: NextRequest) {
  const list: AccesoStored[] = await req.json();
  accesoStore.list = list;
  return NextResponse.json({ ok: true });
}
