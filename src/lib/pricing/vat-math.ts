/**
 * VAT math utilities for price display.
 *
 * All plan prices in VexNexa are stored INCLUSIVE of VAT (gross).
 * These helpers convert between gross ↔ net for display purposes.
 *
 * Client-side calculations are for display only.
 * Server is the source of truth for charged amounts.
 */

/** Base VAT rate used for internal gross→net conversion (NL 21%) */
export const BASE_VAT_RATE = 0.21;

/**
 * Convert a gross (incl. VAT) price to net (excl. VAT).
 * Uses integer-cent math to avoid floating-point drift.
 *
 * Formula: net = gross / (1 + vatRate)
 *
 * @param gross - Price including VAT
 * @param vatRate - VAT rate as decimal (e.g. 0.21 for 21%). Defaults to NL 21%.
 * @returns Net price rounded to 2 decimals
 */
export function grossToNet(gross: number, vatRate: number = BASE_VAT_RATE): number {
  if (vatRate < 0) throw new Error("VAT rate cannot be negative");
  // Work in cents to avoid floating-point issues
  const grossCents = Math.round(gross * 100);
  const netCents = Math.round(grossCents / (1 + vatRate));
  return netCents / 100;
}

/**
 * Convert a net (excl. VAT) price to gross (incl. VAT).
 * Uses integer-cent math to avoid floating-point drift.
 *
 * Formula: gross = net * (1 + vatRate)
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
