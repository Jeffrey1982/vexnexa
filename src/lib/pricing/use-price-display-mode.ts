"use client";

/**
 * React hooks for the global price display mode and country.
 * Subscribe to changes and trigger re-renders.
 */

import { useState, useEffect, useCallback } from "react";
import {
  getPriceDisplayMode,
  setPriceDisplayMode,
  onPriceDisplayModeChange,
  syncDisplayModeToProfile,
  getPricingCountry,
  setPricingCountry,
  onPricingCountryChange,
  type PriceDisplayMode,
} from "./display-mode";

/**
 * Hook that returns the current display mode and a setter.
 * Automatically re-renders when the mode changes (even from other components).
 */
export function usePriceDisplayMode(): [PriceDisplayMode, (mode: PriceDisplayMode) => void] {
  const [mode, setMode] = useState<PriceDisplayMode>(getPriceDisplayMode);

  useEffect(() => {
    setMode(getPriceDisplayMode());
    const unsub = onPriceDisplayModeChange((newMode) => {
      setMode(newMode);
    });
    return unsub;
  }, []);

  const updateMode = useCallback((newMode: PriceDisplayMode) => {
    setPriceDisplayMode(newMode);
    syncDisplayModeToProfile(newMode);
  }, []);

  return [mode, updateMode];
}

/**
 * Hook that returns the current pricing country and a setter.
 * Automatically re-renders when the country changes.
 */
export function usePricingCountry(): [string, (country: string) => void] {
  const [country, setCountry] = useState<string>(getPricingCountry);

  useEffect(() => {
    setCountry(getPricingCountry());
    const unsub = onPricingCountryChange((newCountry) => {
      setCountry(newCountry);
    });
    return unsub;
  }, []);

  const updateCountry = useCallback((newCountry: string) => {
    setPricingCountry(newCountry);
  }, []);

  return [country, updateCountry];
}
