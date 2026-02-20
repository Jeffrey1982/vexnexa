/**
 * Config-driven EU VAT rate map.
 *
 * IMPORTANT: Tax logic depends on jurisdiction and product classification.
 * This implementation is a configurable baseline and should be reviewed
 * with an accountant/legal advisor before relying on it for compliance.
 *
 * For digital services sold B2C within the EU, the place-of-supply rule
 * (OSS / One-Stop-Shop) requires charging VAT at the customer's country
 * rate. This map provides those rates. For B2B with valid VAT ID, reverse
 * charge applies (0%) so these rates are not used.
 *
 * Rates are standard VAT rates as of 2025. Update when rates change.
 * Future: load from DB table or external config for runtime updates.
 */

export interface VatRateEntry {
  /** ISO 3166-1 alpha-2 country code */
  countryCode: string;
  /** Standard VAT rate as a decimal (e.g. 0.21 = 21%) */
  standardRate: number;
  /** Human-readable label */
  label: string;
}

/**
 * EU standard VAT rates by country (2025).
 *
 * Source: https://ec.europa.eu/taxation_customs/vat-rates_en
 * These are standard rates only; reduced rates are not applicable
 * to SaaS/digital services in most jurisdictions.
 */
export const EU_VAT_RATES: Record<string, VatRateEntry> = {
  AT: { countryCode: "AT", standardRate: 0.20, label: "Austria 20%" },
  BE: { countryCode: "BE", standardRate: 0.21, label: "Belgium 21%" },
  BG: { countryCode: "BG", standardRate: 0.20, label: "Bulgaria 20%" },
  HR: { countryCode: "HR", standardRate: 0.25, label: "Croatia 25%" },
  CY: { countryCode: "CY", standardRate: 0.19, label: "Cyprus 19%" },
  CZ: { countryCode: "CZ", standardRate: 0.21, label: "Czechia 21%" },
  DK: { countryCode: "DK", standardRate: 0.25, label: "Denmark 25%" },
  EE: { countryCode: "EE", standardRate: 0.22, label: "Estonia 22%" },
  FI: { countryCode: "FI", standardRate: 0.255, label: "Finland 25.5%" },
  FR: { countryCode: "FR", standardRate: 0.20, label: "France 20%" },
  DE: { countryCode: "DE", standardRate: 0.19, label: "Germany 19%" },
  GR: { countryCode: "GR", standardRate: 0.24, label: "Greece 24%" },
  HU: { countryCode: "HU", standardRate: 0.27, label: "Hungary 27%" },
  IE: { countryCode: "IE", standardRate: 0.23, label: "Ireland 23%" },
  IT: { countryCode: "IT", standardRate: 0.22, label: "Italy 22%" },
  LV: { countryCode: "LV", standardRate: 0.21, label: "Latvia 21%" },
  LT: { countryCode: "LT", standardRate: 0.21, label: "Lithuania 21%" },
  LU: { countryCode: "LU", standardRate: 0.17, label: "Luxembourg 17%" },
  MT: { countryCode: "MT", standardRate: 0.18, label: "Malta 18%" },
  NL: { countryCode: "NL", standardRate: 0.21, label: "Netherlands 21%" },
  PL: { countryCode: "PL", standardRate: 0.23, label: "Poland 23%" },
  PT: { countryCode: "PT", standardRate: 0.23, label: "Portugal 23%" },
  RO: { countryCode: "RO", standardRate: 0.19, label: "Romania 19%" },
  SK: { countryCode: "SK", standardRate: 0.23, label: "Slovakia 23%" },
  SI: { countryCode: "SI", standardRate: 0.22, label: "Slovenia 22%" },
  ES: { countryCode: "ES", standardRate: 0.21, label: "Spain 21%" },
  SE: { countryCode: "SE", standardRate: 0.25, label: "Sweden 25%" },
};

/** Merchant's own country (VexNexa is based in NL) */
export const MERCHANT_COUNTRY = "NL";

/** Default VAT rate when country-specific rate is not configured */
export const DEFAULT_EU_VAT_RATE = 0.21;

/**
 * Look up the standard VAT rate for an EU country.
 * Returns the country-specific rate if configured, otherwise the default.
 */
export function getVatRate(countryCode: string): number {
  const entry = EU_VAT_RATES[countryCode.toUpperCase()];
  return entry?.standardRate ?? DEFAULT_EU_VAT_RATE;
}

/**
 * Get the human-readable VAT rate label for display.
 */
export function getVatRateLabel(countryCode: string): string {
  const entry = EU_VAT_RATES[countryCode.toUpperCase()];
  if (entry) {
    return `VAT ${(entry.standardRate * 100).toFixed(entry.standardRate % 0.01 === 0 ? 0 : 1)}%`;
  }
  return `VAT ${(DEFAULT_EU_VAT_RATE * 100).toFixed(0)}%`;
}
