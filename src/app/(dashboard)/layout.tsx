"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getSession } from "@/lib/app-auth";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    // Cliente users can only access /nomina
    if (session.role === "cliente" && !pathname.startsWith("/nomina")) {
      router.replace("/nomina");
    }
  }, [router, pathname]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
