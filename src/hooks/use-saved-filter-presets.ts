"use client";

import { useEffect, useState } from "react";

export interface SavedFilterPreset<T> {
  id: string;
  name: string;
  value: T;
  createdAt: string;
}

export function useSavedFilterPresets<T>(storageKey: string, maxPresets = 5) {
  const [presets, setPresets] = useState<SavedFilterPreset<T>[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as SavedFilterPreset<T>[];
        if (Array.isArray(parsed)) {
          setPresets(parsed);
        }
      }
    } catch {
      setPresets([]);
    } finally {
      setIsHydrated(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(presets));
  }, [isHydrated, presets, storageKey]);

  const savePreset = (name: string, value: T) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return null;
    }

    const preset: SavedFilterPreset<T> = {
      id: crypto.randomUUID(),
      name: trimmedName,
      value,
      createdAt: new Date().toISOString(),
    };

    setPresets((current) => [preset, ...current.filter((item) => item.name !== trimmedName)].slice(0, maxPresets));
    return preset;
  };

  const deletePreset = (id: string) => {
    setPresets((current) => current.filter((preset) => preset.id !== id));
  };

  const clearPresets = () => {
    setPresets([]);
  };

  return {
    clearPresets,
    deletePreset,
    isHydrated,
    presets,
    savePreset,
  };
}
