import { NextRequest, NextResponse } from "next/server";
import type { AppUser } from "@/lib/app-auth";
import { userStore } from "@/lib/user-store";
import { writeStore } from "@/lib/persist";

export function GET() {
  return NextResponse.json(userStore.list);
}

export async function POST(req: NextRequest) {
  const user: AppUser = await req.json();
  const dup = userStore.list.find(
    (u) => u.email.trim().toLowerCase() === user.email.trim().toLowerCase()
  );
  if (dup) {
    return NextResponse.json({ error: "Email ya registrado" }, { status: 409 });
  }
  userStore.list.push(user);
  writeStore("users", userStore.list);
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest) {
  const updated: AppUser = await req.json();
  const idx = userStore.list.findIndex((u) => u.id === updated.id);
  if (idx === -1) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }
  userStore.list[idx] = updated;
  writeStore("users", userStore.list);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (id === "admin-1") {
    return NextResponse.json({ error: "No se puede eliminar al admin" }, { status: 403 });
  }
  userStore.list = userStore.list.filter((u) => u.id !== id);
  writeStore("users", userStore.list);
  return NextResponse.json({ ok: true });
}
