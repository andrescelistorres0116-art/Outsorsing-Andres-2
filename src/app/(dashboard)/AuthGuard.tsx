"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getSession } from "@/lib/app-auth";

// Renders nothing — only handles auth redirects without touching the layout tree
export default function AuthGuard() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    if (session.role === "cliente" && !pathname.startsWith("/nomina")) {
      router.replace("/nomina");
    }
  }, [pathname, router]);

  return null;
}
