"use client";

import { useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { readSession, writeSession } from "@/lib/auth/session";
import { authApi } from "@/features/auth/api/auth-api";
import type { AuthUser, SessionState } from "@/types/auth";

interface AuthContextValue {
  session: SessionState | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setSession: (session: SessionState | null) => void;
  refreshCurrentUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<SessionState | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const stored = readSession();
    setSessionState(stored);
    setIsHydrated(true);
  }, []);

  const setSession = (nextSession: SessionState | null) => {
    const shouldResetQueries =
      session?.user.id !== nextSession?.user.id ||
      session?.user.organizationId !== nextSession?.user.organizationId;

    setSessionState(nextSession);
    writeSession(nextSession);

    if (shouldResetQueries) {
      void queryClient.clear();
    }
  };

  const refreshCurrentUser = async () => {
    if (!session) return;

    const user = await authApi.me();
    setSession({
      ...session,
      user,
    });
  };

  const logout = async () => {
    try {
      if (session?.accessToken) {
        await authApi.logout({ reason: "user-initiated" });
      }
    } catch {
      toast.error("Logout request could not be completed. Local session has been cleared.");
    }
    setSession(null);
    router.replace("/login");
  };

  const value = useMemo<AuthContextValue>(
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
