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
} from "lucide-react";
import { useState } from "react";
import { signOut } from "next-auth/react";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Empresas",
    href: "/empresas",
    icon: Building2,
  },
  {
    label: "Accesos",
    href: "/accesos",
    icon: KeyRound,
  },
  {
    label: "Calendario Tributario",
    href: "/calendario",
    icon: CalendarCheck,
  },
  {
    label: "Nómina",
    href: "/nomina",
    icon: Users,
  },
  {
    label: "Configuración",
    href: "/configuracion",
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

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
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 shrink-0 shadow-lg shadow-blue-600/25">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-white tracking-tight truncate">
              ContaFlow
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
            const isActive =
              pathname === href || pathname.startsWith(href + "/");
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
                  className={`shrink-0 ${
                    collapsed ? "w-5 h-5" : "w-4 h-4"
                  } ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"}`}
                />
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section: user info + logout */}
        <div className="border-t border-slate-800 p-3 space-y-1">
          {!collapsed && (
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer group">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold shrink-0">
                AC
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">
                  Admin ContaFlow
                </p>
                <p className="text-xs text-slate-500 truncate">
                  admin@contaflow.co
                </p>
              </div>
            </div>
          )}

          <button
            title={collapsed ? "Cerrar sesión" : undefined}
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-150 ${
              collapsed ? "justify-center px-2" : ""
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Cerrar Sesión</span>}
          </button>

          {/* Collapse toggle */}
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
          const isActive =
            pathname === href || pathname.startsWith(href + "/");
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
