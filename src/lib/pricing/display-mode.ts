/**
 * Global price display mode state.
 *
 * Manages whether prices are shown inclusive or exclusive of VAT,
 * and which country's VAT rate to apply for display.
 *
 * Plan prices in VexNexa are stored EXCLUSIVE of VAT (net).
 * When mode is 'incl', the UI shows computed gross prices using
 * the selected country's VAT rate.
 *
 * Server is always the source of truth for charged amounts.
 */

export type PriceDisplayMode = "incl" | "excl";

const MODE_STORAGE_KEY = "vexnexa_price_display_mode";
const COUNTRY_STORAGE_KEY = "vexnexa_price_country";
const DEFAULT_MODE: PriceDisplayMode = "excl";
const DEFAULT_COUNTRY = "NL";

/** In-memory cache for SSR / non-browser environments */
let memoryMode: PriceDisplayMode = DEFAULT_MODE;
let memoryCountry: string = DEFAULT_COUNTRY;

/** Event listeners for mode changes */
type ModeChangeListener = (mode: PriceDisplayMode) => void;
const modeListeners: Set<ModeChangeListener> = new Set();

/** Event listeners for country changes */
type CountryChangeListener = (country: string) => void;
const countryListeners: Set<CountryChangeListener> = new Set();

/**
 * Get the current price display mode.
 */
export function getPriceDisplayMode(): PriceDisplayMode {
  if (typeof window === "undefined") return memoryMode;
  try {
    const stored = localStorage.getItem(MODE_STORAGE_KEY);
    if (stored === "incl" || stored === "excl") return stored;
  } catch {
    // localStorage unavailable
  }
  return DEFAULT_MODE;
}

/**
 * Set the price display mode.
 */
export function setPriceDisplayMode(mode: PriceDisplayMode): void {
  memoryMode = mode;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(MODE_STORAGE_KEY, mode);
    } catch {
      // localStorage unavailable
    }
  }
  modeListeners.forEach((fn) => fn(mode));
}

/**
 * Subscribe to display mode changes.
 */
export function onPriceDisplayModeChange(fn: ModeChangeListener): () => void {
  modeListeners.add(fn);
  return () => {
    modeListeners.delete(fn);
  };
}

/**
 * Get the current pricing country.
 */
export function getPricingCountry(): string {
  if (typeof window === "undefined") return memoryCountry;
  try {
    const stored = localStorage.getItem(COUNTRY_STORAGE_KEY);
    if (stored) return stored;
  } catch {
    // localStorage unavailable
  }
  return DEFAULT_COUNTRY;
}

/**
 * Set the pricing country.
 */
export function setPricingCountry(country: string): void {
  memoryCountry = country;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(COUNTRY_STORAGE_KEY, country);
    } catch {
      // localStorage unavailable
    }
  }
  countryListeners.forEach((fn) => fn(country));
}

/**
 * Subscribe to country changes.
 */
export function onPricingCountryChange(fn: CountryChangeListener): () => void {
  countryListeners.add(fn);
  return () => {
    countryListeners.delete(fn);
  };
}

/**
 * Optionally sync display mode to user profile (fire-and-forget).
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
