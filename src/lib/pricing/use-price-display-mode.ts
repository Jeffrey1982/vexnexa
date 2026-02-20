"use client";

/**
 * React hook for the global price display mode.
 * Subscribes to changes and triggers re-renders.
 */

import { useState, useEffect, useCallback } from "react";
import {
  getPriceDisplayMode,
  setPriceDisplayMode,
  onPriceDisplayModeChange,
  syncDisplayModeToProfile,
  type PriceDisplayMode,
} from "./display-mode";

/**
 * Hook that returns the current display mode and a setter.
 * Automatically re-renders when the mode changes (even from other components).
 */
export function usePriceDisplayMode(): [PriceDisplayMode, (mode: PriceDisplayMode) => void] {
  const [mode, setMode] = useState<PriceDisplayMode>(getPriceDisplayMode);

  useEffect(() => {
    // Sync from localStorage on mount (handles SSR hydration)
    setMode(getPriceDisplayMode());

    // Subscribe to changes from other components
    const unsub = onPriceDisplayModeChange((newMode) => {
      setMode(newMode);
    });
    return unsub;
  }, []);

  const updateMode = useCallback((newMode: PriceDisplayMode) => {
    setPriceDisplayMode(newMode);
    // Fire-and-forget profile sync
    syncDisplayModeToProfile(newMode);
  }, []);

  return [mode, updateMode];
}
