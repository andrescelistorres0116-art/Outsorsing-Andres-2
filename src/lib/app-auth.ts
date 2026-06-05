// Client-side user and session management
// Uses localStorage for persistence + an in-memory cache so the session
// survives client-side navigations even if localStorage is restricted.

export interface AppUser {
  id: string;
  nombre: string;
  email: string;
  password: string;
  role: "admin" | "contador" | "cliente";
  empresaIds: number[];
  activo: boolean;
  creadoEn: string;
}

export interface AppSession {
  userId: string;
  nombre: string;
  email: string;
  role: "admin" | "contador" | "cliente";
  empresaIds: number[];
}

const USERS_KEY = "app-users";
const SESSION_KEY = "app-session";

// In-memory cache — survives client-side navigation, cleared on hard reload
let sessionCache: AppSession | null = null;

export const DEFAULT_ADMIN: AppUser = {
  id: "admin-1",
  nombre: "Admin",
  email: "admin@contaflow.co",
  password: "admin2026",
  role: "admin",
  empresaIds: [],
  activo: true,
  creadoEn: "2026-01-01",
};

// ── Users ──────────────────────────────────────────────────────────────────────

export function getUsers(): AppUser[] {
  // Always return at least the default admin — never depends on localStorage alone
  if (typeof window === "undefined") return [DEFAULT_ADMIN];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      try { localStorage.setItem(USERS_KEY, JSON.stringify([DEFAULT_ADMIN])); } catch {}
      return [DEFAULT_ADMIN];
    }
    const users = JSON.parse(raw) as AppUser[];
    if (!users.find((u) => u.role === "admin")) {
      const all = [DEFAULT_ADMIN, ...users];
      try { localStorage.setItem(USERS_KEY, JSON.stringify(all)); } catch {}
      return all;
    }
    return users;
  } catch {
    return [DEFAULT_ADMIN];
  }
}

export function saveUsers(users: AppUser[]): void {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {}
}

// ── Session ────────────────────────────────────────────────────────────────────

export function getSession(): AppSession | null {
  // In-memory cache takes priority (available even when localStorage is restricted)
  if (sessionCache) return sessionCache;
  if (typeof window === "undefined") return null;
  try {
    const raw =
      localStorage.getItem(SESSION_KEY) ??
      sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      sessionCache = JSON.parse(raw) as AppSession;
      return sessionCache;
    }
  } catch {}
  return null;
}

export function setAppSession(user: AppUser): void {
  const session: AppSession = {
    userId: user.id,
    nombre: user.nombre,
    email: user.email,
    role: user.role,
    empresaIds: user.empresaIds,
  };
  sessionCache = session; // Always succeeds
  const raw = JSON.stringify(session);
  try { localStorage.setItem(SESSION_KEY, raw); } catch {}
  try { sessionStorage.setItem(SESSION_KEY, raw); } catch {}
  // Cookie lets the server-side proxy verify auth on navigation
  try {
    document.cookie = `${SESSION_KEY}=1; path=/; samesite=lax`;
  } catch {}
}

export function clearSession(): void {
  sessionCache = null;
  try { localStorage.removeItem(SESSION_KEY); } catch {}
  try { sessionStorage.removeItem(SESSION_KEY); } catch {}
  try {
    document.cookie = `${SESSION_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  } catch {}
}

// ── Auth ───────────────────────────────────────────────────────────────────────

export async function tryLogin(email: string, password: string): Promise<AppUser | null> {
  try {
    const res = await fetch("/api/app-users/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return null;
    return (await res.json()) as AppUser | null;
  } catch {
    return null;
  }
}

export function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// Fetches the latest empresaIds from the server so modules always reflect
// admin changes without requiring the user to log out and back in.
export async function getSessionFresh(): Promise<AppSession | null> {
  const s = getSession();
  if (!s) return null;
  if (s.role === "admin") return s;
  try {
    const res = await fetch("/api/app-users");
    if (!res.ok) return s;
    const users: AppUser[] = await res.json();
    const me = users.find((u) => u.id === s.userId);
    if (me) return { ...s, empresaIds: me.empresaIds };
  } catch {}
  return s;
}
