"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isHydrated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname ?? "/dashboard")}`);
    }
  }, [isAuthenticated, isHydrated, pathname, router]);

  if (!isHydrated || !isAuthenticated) {
    return <div className="p-8 text-sm text-muted-foreground">Loading secure workspace...</div>;
  }

  return <>{children}</>;
}
