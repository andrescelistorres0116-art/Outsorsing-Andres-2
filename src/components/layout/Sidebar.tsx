"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  KeyRound,
  CalendarCheck,
  Users,
  Settings,
  TrendingUp,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserCog,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAppSession } from "@/hooks/useAppSession";
import { initials } from "@/lib/app-auth";

const ADMIN_NAV = [
  { label: "Dashboard",           href: "/dashboard",   icon: LayoutDashboard },
  { label: "Empresas",            href: "/empresas",    icon: Building2 },
  { label: "Accesos",             href: "/accesos",     icon: KeyRound },
  { label: "Calendario Tributario", href: "/calendario", icon: CalendarCheck },
  { label: "Nómina",              href: "/nomina",      icon: Users },
  { label: "Configuración",       href: "/configuracion", icon: Settings },
];

const ADMIN_EXTRA = [
  { label: "Usuarios", href: "/usuarios", icon: UserCog },
];

const CONTADOR_NAV = [
  { label: "Empresas",              href: "/empresas",    icon: Building2 },
  { label: "Accesos",               href: "/accesos",     icon: KeyRound },
  { label: "Calendario Tributario", href: "/calendario",  icon: CalendarCheck },
  { label: "Nómina",                href: "/nomina",      icon: Users },
];

const CLIENT_NAV = [
  { label: "Nómina", href: "/nomina", icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { appSession, signOut } = useAppSession();
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarName, setSidebarName] = useState("Outsoursing Andrés");
  const [sidebarLogo, setSidebarLogo] = useState<string | null>(null);

  useEffect(() => {
    setSidebarName(localStorage.getItem("company_name") ?? "Outsoursing Andrés");
    setSidebarLogo(localStorage.getItem("company_logo") ?? null);

    function onSettingsUpdate(e: Event) {
      const { name, logo } = (e as CustomEvent).detail ?? {};
      if (name) setSidebarName(name);
      setSidebarLogo(logo ?? null);
    }
    window.addEventListener("company-settings-updated", onSettingsUpdate);
    return () => window.removeEventListener("company-settings-updated", onSettingsUpdate);
  }, []);

  const role = appSession?.role ?? "cliente";
  const navItems =
    role === "admin" ? ADMIN_NAV :
    role === "contador" ? CONTADOR_NAV :
    CLIENT_NAV;
  const extraItems = role === "admin" ? ADMIN_EXTRA : [];

  const userInitials = appSession ? initials(appSession.nombre) : "?";
  const userName = appSession?.nombre ?? "";
  const userEmail = appSession?.email ?? "";

  function handleLogout() {
    signOut();
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 ease-in-out shrink-0 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Logo */}
        <div
          className={`flex items-center h-16 px-4 border-b border-slate-800 ${
            collapsed ? "justify-center" : "gap-3"
          }`}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 shrink-0 shadow-lg shadow-blue-600/25 overflow-hidden">
            {sidebarLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={sidebarLogo} alt="Logo" className="w-8 h-8 object-cover" />
            ) : (
              <TrendingUp className="w-4 h-4 text-white" />
            )}
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-white tracking-tight truncate">
              {sidebarName}
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {!collapsed && (
            <p className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Principal
            </p>
          )}
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                } ${collapsed ? "justify-center px-2" : ""}`}
              >
                <Icon
                  className={`shrink-0 ${collapsed ? "w-5 h-5" : "w-4 h-4"} ${
                    isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                  }`}
                />
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}

          {/* Admin-only section */}
          {extraItems.length > 0 && (
            <>
              {!collapsed && (
                <p className="px-3 mt-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Administración
                </p>
              )}
              {collapsed && <div className="my-2 border-t border-slate-800/60" />}
              {extraItems.map(({ label, href, icon: Icon }) => {
                const isActive = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    title={collapsed ? label : undefined}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group ${
                      isActive
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                    } ${collapsed ? "justify-center px-2" : ""}`}
                  >
                    <Icon
                      className={`shrink-0 ${collapsed ? "w-5 h-5" : "w-4 h-4"} ${
                        isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                      }`}
                    />
                    {!collapsed && <span className="truncate">{label}</span>}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* Bottom: user info + logout + collapse */}
        <div className="border-t border-slate-800 p-3 space-y-1">
          {!collapsed && (
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-800 transition-colors cursor-default">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold shrink-0">
                {userInitials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{userName}</p>
                <p className="text-xs text-slate-500 truncate">{userEmail}</p>
              </div>
            </div>
          )}

          <button
            title={collapsed ? "Cerrar sesión" : undefined}
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-150 ${
              collapsed ? "justify-center px-2" : ""
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Cerrar Sesión</span>}
          </button>

          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expandir menú" : "Colapsar menú"}
            className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all duration-150 ${
              collapsed ? "justify-center px-2" : ""
            }`}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4 shrink-0" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 shrink-0" />
                <span>Colapsar</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-slate-900 border-t border-slate-800 flex items-center justify-around px-2 py-2">
        {navItems.slice(0, 5).map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                isActive ? "text-blue-400" : "text-slate-500"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-none">
                {label.split(" ")[0]}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
