"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

// Renders nothing — only handles auth redirects without touching the layout tree
export default function AuthGuard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    const role = (session?.user as any)?.role;
    if (role === "cliente" && !pathname.startsWith("/nomina")) {
      router.replace("/nomina");
    }
  }, [status, session, router, pathname]);

  return null;
}
