/**
 * Domain normalization utilities for public report URLs.
 *
 * Rules:
 * - lowercase
 * - strip protocol (http:// / https://)
 * - strip trailing slash
 * - strip www.
 * - remove path / query / fragment for domain-level pages
 * - store both raw input and normalized domain
 */

/**
 * Normalize a URL or domain string into a canonical domain slug.
 * Examples:
 *   "https://www.Example.com/"       → "example.com"
 *   "http://example.com/test?page=1" → "example.com"
 *   "WWW.FOO.CO.UK"                  → "foo.co.uk"
 */
export function normalizeDomain(input: string): string {
  let raw = input.trim();

  // Add protocol if missing so URL constructor works
  if (!/^https?:\/\//i.test(raw)) {
    raw = `https://${raw}`;
  }

  try {
    const url = new URL(raw);
    let hostname = url.hostname.toLowerCase();

    // Strip www. prefix
    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4);
    }

    return hostname;
  } catch {
    // Fallback: manual cleaning for edge cases
    let cleaned = raw
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .split('/')[0]
      .split('?')[0]
      .split('#')[0]
      .toLowerCase()
      .replace(/\.$/, '')
      .replace(/\/+$/, '');

    return cleaned;
  }
}

/**
 * Extract a display-friendly domain from raw input.
 * Preserves casing intent but still normalizes structure.
 */
export function extractDisplayDomain(input: string): string {
  let raw = input.trim();

  if (!/^https?:\/\//i.test(raw)) {
    raw = `https://${raw}`;
  }

  try {
    const url = new URL(raw);
    let hostname = url.hostname.toLowerCase();
    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4);
    }
    return hostname;
  } catch {
    return normalizeDomain(input);
  }
}

/**
 * Generate a URL-safe slug from a normalized domain.
 * Dots become dots (they are URL-safe in path segments).
 */
export function domainToSlug(normalizedDomain: string): string {
  return normalizedDomain;
}

/**
 * Reverse a slug back to a domain (identity for our scheme).
 */
export function slugToDomain(slug: string): string {
  return slug.toLowerCase();
}

/**
 * Build the canonical public report URL for a domain.
 */
export function getPublicReportUrl(normalizedDomain: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vexnexa.com';
  return `${baseUrl}/report/${normalizedDomain}`;
}

/**
 * Build the versioned report URL for a specific scan.
 */
export function getVersionedReportUrl(normalizedDomain: string, scanId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vexnexa.com';
  return `${baseUrl}/report/${normalizedDomain}/${scanId}`;
}

/**
 * Validate that a domain string is reasonable (not empty, has a TLD).
 */
export function isValidDomain(domain: string): boolean {
  if (!domain || domain.length < 3) return false;
  // Must have at least one dot and no spaces
  if (!domain.includes('.') || domain.includes(' ')) return false;
  // Basic TLD check
  const parts = domain.split('.');
  const tld = parts[parts.length - 1];
  if (tld.length < 2 || tld.length > 20) return false;
  return true;
}
