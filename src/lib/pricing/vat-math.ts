/**
 * VAT math utilities for price display and Mollie payment calculation.
 *
 * All plan prices in VexNexa are stored EXCLUSIVE of VAT (net).
 * When mode is 'incl', the UI shows computed gross prices for display only.
 * When sending to Mollie, getPriceInclVat() computes the amount incl. VAT
 * based on the customer's country.
 *
 * Server (computeTaxDecision in tax/rules.ts) is the source of truth
 * for charged amounts. These client-side helpers are for display only.
 */

/** Base VAT rate (NL 21%) — used as default / fallback */
export const BASE_VAT_RATE = 0.21;

/**
 * Client-side VAT rate map for pricing page display.
 * Keys: ISO 3166-1 alpha-2 country codes.
 *
 * NOTE: Server-side tax logic in tax/rules.ts is the source of truth.
 * This map is for client-side price previews only.
 */
export const PRICING_VAT_RATES: Record<string, number> = {
  NL: 0.21,
  BE: 0.21,
  DE: 0.19,
  FR: 0.20,
  GB: 0.20,
  SE: 0.25,
  DK: 0.25,
  FI: 0.255,
  NO: 0.25,
  IT: 0.22,
  ES: 0.21,
  PL: 0.23,
  PT: 0.23,
  AT: 0.20,
  CH: 0.081,
  US: 0.00,
};

/** Country display labels for the pricing page dropdown */
export const PRICING_COUNTRY_OPTIONS: Array<{
  code: string;
  flag: string;
  label: string;
  vatPercent: number;
}> = [
  { code: "NL", flag: "🇳🇱", label: "Nederland", vatPercent: 21 },
  { code: "BE", flag: "🇧🇪", label: "België", vatPercent: 21 },
  { code: "DE", flag: "🇩🇪", label: "Duitsland", vatPercent: 19 },
  { code: "FR", flag: "🇫🇷", label: "Frankrijk", vatPercent: 20 },
  { code: "GB", flag: "🇬🇧", label: "VK", vatPercent: 20 },
  { code: "SE", flag: "🇸🇪", label: "Zweden", vatPercent: 25 },
  { code: "DK", flag: "🇩🇰", label: "Denemarken", vatPercent: 25 },
  { code: "IT", flag: "🇮🇹", label: "Italië", vatPercent: 22 },
  { code: "ES", flag: "🇪🇸", label: "Spanje", vatPercent: 21 },
  { code: "CH", flag: "🇨🇭", label: "Zwitserland", vatPercent: 8.1 },
  { code: "US", flag: "🇺🇸", label: "USA", vatPercent: 0 },
  { code: "EU", flag: "🇪🇺", label: "Overig EU", vatPercent: 21 },
];

/**
 * Get the VAT rate for a country (client-side, for display).
 * Falls back to NL 21% for unknown countries.
 */
export function getClientVatRate(countryCode: string): number {
  return PRICING_VAT_RATES[countryCode.toUpperCase()] ?? 0.21;
}

/**
 * Calculate price inclusive of VAT from an excl. VAT price.
 * Uses integer-cent math to avoid floating-point drift.
 *
 * @param priceExclVat - Price excluding VAT
 * @param country - ISO country code (e.g. "NL", "DE")
 * @returns Price including VAT, rounded to 2 decimals
 */
export function getPriceInclVat(priceExclVat: number, country: string): number {
  const rate = getClientVatRate(country);
  const netCents = Math.round(priceExclVat * 100);
  const grossCents = Math.round(netCents * (1 + rate));
  return grossCents / 100;
}

/**
 * Get the VAT amount for a given excl. VAT price and country.
 */
export function getVatAmount(priceExclVat: number, country: string): number {
  return Math.round((getPriceInclVat(priceExclVat, country) - priceExclVat) * 100) / 100;
}

/**
 * Convert a gross (incl. VAT) price to net (excl. VAT).
 * Uses integer-cent math to avoid floating-point drift.
 *
 * @param gross - Price including VAT
 * @param vatRate - VAT rate as decimal (e.g. 0.21 for 21%). Defaults to NL 21%.
 * @returns Net price rounded to 2 decimals
 */
export function grossToNet(gross: number, vatRate: number = BASE_VAT_RATE): number {
  if (vatRate < 0) throw new Error("VAT rate cannot be negative");
  const grossCents = Math.round(gross * 100);
  const netCents = Math.round(grossCents / (1 + vatRate));
  return netCents / 100;
}

/**
 * Convert a net (excl. VAT) price to gross (incl. VAT).
 * Uses integer-cent math to avoid floating-point drift.
 *
 * @param net - Price excluding VAT
 * @param vatRate - VAT rate as decimal (e.g. 0.21 for 21%). Defaults to NL 21%.
 * @returns Gross price rounded to 2 decimals
 */
export function netToGross(net: number, vatRate: number = BASE_VAT_RATE): number {
  if (vatRate < 0) throw new Error("VAT rate cannot be negative");
  const netCents = Math.round(net * 100);
  const grossCents = Math.round(netCents * (1 + vatRate));
  return grossCents / 100;
}

/**
 * Compute the VAT amount from a gross price.
 *
 * @param gross - Price including VAT
 * @param vatRate - VAT rate as decimal. Defaults to NL 21%.
 * @returns VAT amount rounded to 2 decimals
 */
export function vatFromGross(gross: number, vatRate: number = BASE_VAT_RATE): number {
  return Math.round((gross - grossToNet(gross, vatRate)) * 100) / 100;
}

/**
 * Format a monetary value for display.
 *
 * @param value - Amount to format
 * @param currency - ISO 4217 currency code (default EUR)
 * @param locale - BCP 47 locale (default nl-NL)
 * @returns Formatted string e.g. "€ 24,99"
 */
export function formatMoney(
  value: number,
  currency: string = "EUR",
  locale: string = "nl-NL"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
