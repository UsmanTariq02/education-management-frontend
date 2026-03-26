"use client";

import type { PortalSessionState } from "@/types/auth";
import { PORTAL_SESSION_STORAGE_KEY } from "@/lib/constants/app";

export function readPortalSession(): PortalSessionState | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(PORTAL_SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PortalSessionState;
  } catch {
    window.localStorage.removeItem(PORTAL_SESSION_STORAGE_KEY);
    return null;
  }
}

export function writePortalSession(session: PortalSessionState | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(PORTAL_SESSION_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(PORTAL_SESSION_STORAGE_KEY, JSON.stringify(session));
}
