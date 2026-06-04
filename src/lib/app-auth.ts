// Client-side user and session management
// Uses localStorage for persistence + an in-memory cache so the session
// survives client-side navigations even if localStorage is restricted.

export interface AppUser {
  id: string;
  nombre: string;
  email: string;
  password: string;
  role: "admin" | "cliente";
  empresaIds: number[];
  activo: boolean;
  creadoEn: string;
}

export interface AppSession {
  userId: string;
  nombre: string;
  email: string;
  role: "admin" | "cliente";
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
    const raw = localStorage.getItem(SESSION_KEY);
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
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {}
}

export function clearSession(): void {
  sessionCache = null;
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {}
}

// ── Auth ───────────────────────────────────────────────────────────────────────

export function tryLogin(email: string, password: string): AppUser | null {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const users = getUsers();
    return (
      users.find(
        (u) =>
          u.email.trim().toLowerCase() === normalizedEmail &&
          u.password === password &&
          u.activo
      ) ?? null
    );
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
