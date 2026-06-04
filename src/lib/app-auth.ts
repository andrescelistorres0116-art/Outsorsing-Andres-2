// Client-side user and session management — stored in localStorage

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

export function getUsers(): AppUser[] {
  if (typeof window === "undefined") return [DEFAULT_ADMIN];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      localStorage.setItem(USERS_KEY, JSON.stringify([DEFAULT_ADMIN]));
      return [DEFAULT_ADMIN];
    }
    const users = JSON.parse(raw) as AppUser[];
    // Always ensure at least one admin exists
    if (!users.find((u) => u.role === "admin")) {
      const all = [DEFAULT_ADMIN, ...users];
      localStorage.setItem(USERS_KEY, JSON.stringify(all));
      return all;
    }
    return users;
  } catch {
    return [DEFAULT_ADMIN];
  }
}

export function saveUsers(users: AppUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getSession(): AppSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AppSession) : null;
  } catch {
    return null;
  }
}

export function setAppSession(user: AppUser): void {
  const session: AppSession = {
    userId: user.id,
    nombre: user.nombre,
    email: user.email,
    role: user.role,
    empresaIds: user.empresaIds,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function tryLogin(email: string, password: string): AppUser | null {
  const users = getUsers();
  return (
    users.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password &&
        u.activo
    ) ?? null
  );
}

export function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
