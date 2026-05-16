"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { readPortalSession, writePortalSession } from "@/lib/auth/portal-session";
import { portalAuthApi } from "@/features/portal/api/portal-auth-api";
import type { PortalAuthUser, PortalSessionState } from "@/types/auth";

interface PortalAuthContextValue {
  session: PortalSessionState | null;
  user: PortalAuthUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setSession: (session: PortalSessionState | null) => void;
  refreshCurrentUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const PortalAuthContext = createContext<PortalAuthContextValue | undefined>(undefined);

export function PortalAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<PortalSessionState | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const stored = readPortalSession();
    setSessionState(stored);
    setIsHydrated(true);
  }, []);

  const setSession = (nextSession: PortalSessionState | null) => {
    setSessionState(nextSession);
    writePortalSession(nextSession);
  };

  const refreshCurrentUser = async () => {
    if (!session) return;
    const user = await portalAuthApi.me();
    setSession({ ...session, user });
  };

  const logout = async () => {
    try {
      if (session?.accessToken) {
        await portalAuthApi.logout({ reason: "portal-user-initiated" });
      }
    } catch {
      toast.error("Portal logout request failed. Local session has been cleared.");
    }
    setSession(null);
    router.replace("/portal/login");
  };

  const value = useMemo<PortalAuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isAuthenticated: Boolean(session?.accessToken),
      isHydrated,
      setSession,
      refreshCurrentUser,
      logout,
    }),
    [isHydrated, session],
  );

  return <PortalAuthContext.Provider value={value}>{children}</PortalAuthContext.Provider>;
}

export function usePortalAuth() {
  const context = useContext(PortalAuthContext);
  if (!context) {
    throw new Error("usePortalAuth must be used inside PortalAuthProvider");
  }
  return context;
}
