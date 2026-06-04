"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession, clearSession, initials, AppSession } from "@/lib/app-auth";
import { useTheme } from "next-themes";
import {
  Bell,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  User,
  Settings,
  AlertTriangle,
  Users,
} from "lucide-react";
import type { AppNotification } from "@/app/api/app-notifications/route";

export default function Header() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [session, setSession] = useState<AppSession | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSession(getSession());
  }, []);

  useEffect(() => {
    fetch("/api/app-notifications")
      .then((r) => r.json())
      .then((data: AppNotification[]) => setNotifications(data))
      .catch(() => {});
  }, []);

  const userName = session?.nombre ?? "Admin";
  const userEmail = session?.email ?? "";
  const userRole = session?.role === "admin" ? "Administrador" : "Cliente";
  const userInitials = session ? initials(session.nombre) : "?";

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  function markAllRead() {
    setReadIds(new Set(notifications.map((n) => n.id)));
  }

  function diasLabel(dias: number): string {
    if (dias === 0) return "vence hoy";
    if (dias === 1) return "vence mañana";
    return `vence en ${dias} días`;
  }

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-6 gap-4 shrink-0 z-10">
      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
          Dashboard
        </h1>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="relative flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-150"
          aria-label="Alternar modo oscuro"
        >
          <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 absolute" />
          <Moon className="w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 absolute" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="relative flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-150"
            aria-label="Notificaciones"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex items-center justify-center w-4 h-4 text-[9px] font-bold text-white bg-blue-600 rounded-full shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications dropdown */}
          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 top-11 z-20 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl shadow-black/10 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Notificaciones
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-blue-600 font-medium hover:text-blue-700"
                    >
                      Marcar todo como leído
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">
                      Sin alertas pendientes
                    </p>
                  ) : (
                    notifications.map((n) => {
                      const isUnread = !readIds.has(n.id);
                      const Icon =
                        n.tipo === "nomina" ? Users : AlertTriangle;
                      const iconColor =
                        n.tipo === "nomina"
                          ? "text-blue-500"
                          : n.diasRestantes === 0
                          ? "text-red-500"
                          : n.diasRestantes <= 2
                          ? "text-orange-500"
                          : "text-yellow-500";
                      return (
                        <div
                          key={n.id}
                          onClick={() =>
                            setReadIds((prev) => new Set([...prev, n.id]))
                          }
                          className={`flex gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer ${
                            isUnread
                              ? "bg-blue-50/40 dark:bg-blue-900/10"
                              : ""
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isUnread ? (
                              <div className="w-2 h-2 rounded-full bg-blue-600 mt-1" />
                            ) : (
                              <div className="w-2 h-2" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <Icon className={`w-3 h-3 shrink-0 ${iconColor}`} />
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                {n.title}
                              </p>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                              {n.message}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                              {diasLabel(n.diasRestantes)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      router.push("/calendario");
                    }}
                    className="w-full text-xs text-center text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium py-0.5"
                  >
                    Ver todas las notificaciones
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User avatar dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold shadow-sm shrink-0">
              {userInitials}
            </div>
            <div className="hidden md:block text-left min-w-0">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-tight truncate max-w-[120px]">
                {userName}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight truncate max-w-[120px]">
                {userRole}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block shrink-0" />
          </button>

          {/* User dropdown */}
          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-11 z-20 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl shadow-black/10 overflow-hidden py-1">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {userName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {userEmail}
                  </p>
                </div>
                <div className="py-1">
                  <button className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <User className="w-4 h-4 text-slate-400" />
                    Mi Perfil
                  </button>
                  <button className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <Settings className="w-4 h-4 text-slate-400" />
                    Configuración
                  </button>
                </div>
                <div className="py-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
