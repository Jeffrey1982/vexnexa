/**
 * Client-side format validation for VAT IDs and KVK numbers.
 *
 * These checks prevent obvious garbage input before it reaches
 * the server. They do NOT replace server-side VIES/KVK validation.
 *
 * Validation never blocks checkout — it only provides feedback.
 */

// ── VAT ID Format Validation ──

/**
 * EU VAT ID format patterns per country.
 * Basic regex patterns — not exhaustive, but catch obvious errors.
 */
const VAT_FORMAT_PATTERNS: Record<string, RegExp> = {
  AT: /^ATU\d{8}$/,
  BE: /^BE0\d{9}$/,
  BG: /^BG\d{9,10}$/,
  HR: /^HR\d{11}$/,
  CY: /^CY\d{8}[A-Z]$/,
  CZ: /^CZ\d{8,10}$/,
  DK: /^DK\d{8}$/,
  EE: /^EE\d{9}$/,
  FI: /^FI\d{8}$/,
  FR: /^FR[A-HJ-NP-Z0-9]{2}\d{9}$/,
  DE: /^DE\d{9}$/,
  GR: /^EL\d{9}$/,
  HU: /^HU\d{8}$/,
  IE: /^IE\d{7}[A-Z]{1,2}$|^IE\d[A-Z+*]\d{5}[A-Z]$/,
  IT: /^IT\d{11}$/,
  LV: /^LV\d{11}$/,
  LT: /^LT(\d{9}|\d{12})$/,
  LU: /^LU\d{8}$/,
  MT: /^MT\d{8}$/,
  NL: /^NL\d{9}B\d{2}$/,
  PL: /^PL\d{10}$/,
  PT: /^PT\d{9}$/,
  RO: /^RO\d{2,10}$/,
  SK: /^SK\d{10}$/,
  SI: /^SI\d{8}$/,
  ES: /^ES[A-Z0-9]\d{7}[A-Z0-9]$/,
  SE: /^SE\d{12}$/,
};

export interface VatValidationResult {
  valid: boolean;
  normalized: string;
  error?: string;
}

/**
 * Normalize a VAT ID: strip whitespace, dots, dashes, uppercase.
 */
export function normalizeVatId(vatId: string): string {
  return vatId.replace(/[\s.\-/]/g, "").toUpperCase();
}

/**
 * Client-side VAT ID format check.
 *
 * Returns a friendly validation result. Does NOT check with VIES —
 * that happens server-side via /api/billing/validate-vat.
 */
export function validateVatFormat(vatId: string): VatValidationResult {
  const normalized = normalizeVatId(vatId);

  if (!normalized) {
    return { valid: false, normalized, error: "VAT number is required" };
  }

  if (normalized.length < 4) {
    return {
      valid: false,
      normalized,
      error: "VAT number is too short",
    };
  }

  // Extract country prefix (first 2 chars, except Greece uses EL)
  const countryPrefix = normalized.slice(0, 2);
  const pattern = VAT_FORMAT_PATTERNS[countryPrefix];

  if (!pattern) {
    // Unknown country prefix — allow it through (server will validate)
    if (/^[A-Z]{2}/.test(normalized)) {
      return { valid: true, normalized };
    }
    return {
      valid: false,
      normalized,
      error: "VAT number should start with a 2-letter country code (e.g. NL, DE, BE)",
    };
  }

  if (!pattern.test(normalized)) {
    const examples: Record<string, string> = {
      NL: "NL123456789B01",
      DE: "DE123456789",
      BE: "BE0123456789",
      FR: "FRXX123456789",
      AT: "ATU12345678",
      ES: "ESA12345678",
      IT: "IT12345678901",
    };
    const example = examples[countryPrefix];
    return {
      valid: false,
      normalized,
      error: example
        ? `Invalid format for ${countryPrefix}. Expected format: ${example}`
        : `Invalid VAT number format for ${countryPrefix}`,
    };
  }

  return { valid: true, normalized };
}

// ── KVK Number Validation ──

export interface KvkValidationResult {
  valid: boolean;
  normalized: string;
  error?: string;
}

/**
 * Normalize a KVK number: strip everything except digits.
 */
export function normalizeKvkNumber(kvk: string): string {
  return kvk.replace(/\D/g, "");
}

/**
 * Client-side KVK number format check.
 *
 * KVK numbers are exactly 8 digits. This is a simple sanity check
 * before sending to the server for actual lookup.
 */
export function validateKvkFormat(kvk: string): KvkValidationResult {
  const normalized = normalizeKvkNumber(kvk);

  if (!normalized) {
    return { valid: false, normalized, error: "KVK number is required" };
  }

  if (normalized.length < 8) {
    return {
      valid: false,
      normalized,
      error: `KVK number must be 8 digits (got ${normalized.length})`,
    };
  }

  if (normalized.length > 8) {
    return {
      valid: false,
      normalized,
      error: "KVK number must be exactly 8 digits",
    };
  }

  // Basic sanity: not all zeros or repeating
  if (/^0+$/.test(normalized) || /^(\d)\1{7}$/.test(normalized)) {
    return {
      valid: false,
      normalized,
      error: "Please enter a valid KVK number",
    };
  }

  return { valid: true, normalized };
}

// ── Company Name Validation ──

/**
 * Basic company name sanity check.
 */
export function validateCompanyName(name: string): {
  valid: boolean;
  error?: string;
} {
  const trimmed = name.trim();
  if (!trimmed) {
    return { valid: false, error: "Company name is required" };
  }
  if (trimmed.length < 2) {
    return { valid: false, error: "Company name is too short" };
  }
  if (trimmed.length > 200) {
    return { valid: false, error: "Company name is too long" };
  }
  return { valid: true };
}
