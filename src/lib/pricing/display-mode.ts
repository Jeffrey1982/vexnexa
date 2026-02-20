/**
 * Global price display mode state.
 *
 * Manages whether prices are shown inclusive or exclusive of VAT.
 * Persists to localStorage and optionally syncs to user profile.
 *
 * Plan prices in VexNexa are stored INCLUSIVE of VAT (gross).
 * When mode is 'excl', the UI shows computed net prices for display only.
 * Server is always the source of truth for charged amounts.
 */

export type PriceDisplayMode = "incl" | "excl";

const STORAGE_KEY = "vexnexa_price_display_mode";
const DEFAULT_MODE: PriceDisplayMode = "incl";

/** In-memory cache for SSR / non-browser environments */
let memoryMode: PriceDisplayMode = DEFAULT_MODE;

/** Event listeners for mode changes */
type ModeChangeListener = (mode: PriceDisplayMode) => void;
const listeners: Set<ModeChangeListener> = new Set();

/**
 * Get the current price display mode.
 * Reads from localStorage if available, otherwise returns default.
 */
export function getPriceDisplayMode(): PriceDisplayMode {
  if (typeof window === "undefined") return memoryMode;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "incl" || stored === "excl") return stored;
  } catch {
    // localStorage unavailable (e.g. private browsing)
  }
  return DEFAULT_MODE;
}

/**
 * Set the price display mode.
 * Persists to localStorage and notifies all listeners.
 */
export function setPriceDisplayMode(mode: PriceDisplayMode): void {
  memoryMode = mode;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // localStorage unavailable
    }
  }
  // Notify all listeners
  listeners.forEach((fn) => fn(mode));
}

/**
 * Subscribe to display mode changes.
 * Returns an unsubscribe function.
 */
export function onPriceDisplayModeChange(fn: ModeChangeListener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/**
 * Optionally sync display mode to user profile (fire-and-forget).
 * Called after login or when mode changes for a logged-in user.
 */
export async function syncDisplayModeToProfile(mode: PriceDisplayMode): Promise<void> {
  try {
    await fetch("/api/user/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceDisplayMode: mode }),
    });
  } catch {
    // Non-fatal: localStorage is the primary store
  }
}
