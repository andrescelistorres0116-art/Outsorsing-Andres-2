import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { userStore } from "@/lib/user-store";
import { writeStore } from "@/lib/persist";

// In-memory rate limiter: 5 attempts per 60 s per IP
const attempts = new Map<string, { count: number; resetAt: number }>();

function getRateKey(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

const BCRYPT_COST = 10;

export async function POST(req: NextRequest) {
  try {
    const ip = getRateKey(req);
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
    }

    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json(null);

    const normalizedEmail = (email as string).trim().toLowerCase();
    const userIdx = userStore.list.findIndex(
      (u) => u.email.trim().toLowerCase() === normalizedEmail && u.activo
    );

    if (userIdx === -1) return NextResponse.json(null);
    const user = userStore.list[userIdx];

    let passwordMatch: boolean;
    let isLegacyPlaintext = false;

    if (user.password.startsWith("$2")) {
      // Modern bcrypt hash
      passwordMatch = await bcrypt.compare(password, user.password);
    } else {
      // Legacy plaintext — empty string is never a valid password
      passwordMatch = user.password !== "" && user.password === password;
      if (passwordMatch) isLegacyPlaintext = true;
    }

    if (!passwordMatch) return NextResponse.json(null);

    // Auto-migrate legacy plaintext to bcrypt on first successful login
    if (isLegacyPlaintext) {
      try {
        const newHash = await bcrypt.hash(password, BCRYPT_COST);
        userStore.list[userIdx] = { ...user, password: newHash };
        writeStore("users", userStore.list);
      } catch {
        // Non-fatal: login still succeeds even if migration write fails
      }
    }

    // Never send the password field back to the client
    const { password: _pw, ...safeUser } = userStore.list[userIdx];
    void _pw;
    return NextResponse.json(safeUser);
  } catch {
    return NextResponse.json(null, { status: 500 });
  }
}
