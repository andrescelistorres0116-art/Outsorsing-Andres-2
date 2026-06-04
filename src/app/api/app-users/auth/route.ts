import { NextRequest, NextResponse } from "next/server";
import { userStore } from "@/lib/user-store";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json(null);

    const normalizedEmail = (email as string).trim().toLowerCase();
    const user = userStore.list.find(
      (u) =>
        u.email.trim().toLowerCase() === normalizedEmail &&
        u.password === password &&
        u.activo
    );
    return NextResponse.json(user ?? null);
  } catch {
    return NextResponse.json(null, { status: 500 });
  }
}
