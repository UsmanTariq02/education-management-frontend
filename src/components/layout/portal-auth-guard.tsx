"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePortalAuth } from "@/providers/portal-auth-provider";

export function PortalAuthGuard({ children, accountType }: { children: React.ReactNode; accountType: "STUDENT" | "PARENT" }) {
  const { isAuthenticated, isHydrated, user } = usePortalAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.replace(`/portal/login?redirect=${encodeURIComponent(pathname ?? "/portal/login")}`);
      return;
    }
    if (user && user.accountType !== accountType) {
      router.replace(user.accountType === "PARENT" ? "/portal/parent" : "/portal/student");
    }
  }, [accountType, isAuthenticated, isHydrated, pathname, router, user]);

  if (!isHydrated || !isAuthenticated || user?.accountType !== accountType) {
    return <div className="p-8 text-sm text-muted-foreground">Loading portal workspace...</div>;
  }

  return <>{children}</>;
}
