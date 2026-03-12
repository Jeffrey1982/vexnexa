/**
 * KvK (Kamer van Koophandel) API lookup for Dutch companies.
 *
 * Uses the KvK Search API to look up company details by KvK number.
 * Requires KVK_API_KEY environment variable.
 *
 * API docs: https://developers.kvk.nl/documentation/search-v2
 *
 * Fallback: If KvK API is unavailable, the caller should fall back
 * to VIES company name from VAT validation.
 */

export interface KvkResult {
  found: boolean;
  companyName?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  kvkNumber?: string;
}

/**
 * Look up a Dutch company by KvK number.
 *
 * @param kvkNumber - 8-digit KvK number
 * @returns Company details or { found: false }
 */
export async function lookupKvk(kvkNumber: string): Promise<KvkResult> {
  const apiKey = process.env.KVK_API_KEY;
  if (!apiKey) {
    console.warn("[kvkLookup] KVK_API_KEY not configured, skipping lookup");
    return { found: false };
  }

  // Validate format: 8 digits
  const cleaned = kvkNumber.replace(/\D/g, "");
  if (cleaned.length !== 8) {
    return { found: false };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const url = `https://api.kvk.nl/api/v1/basisprofielen/${cleaned}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        apikey: apiKey,
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { found: false };
      }
      throw new Error(`KvK API returned ${response.status}`);
    }

    const data = await response.json();

    // Extract the main trade name
    const companyName =
      data.naam ??
      data.handelsnaam ??
      data._embedded?.hoofdvestiging?.naam ??
      undefined;

    // Extract address from embedded location
    const address = extractAddress(data);

    return {
      found: true,
      companyName: companyName || undefined,
      street: address?.street || undefined,
      city: address?.city || undefined,
      postalCode: address?.postalCode || undefined,
      kvkNumber: cleaned,
    };
  } catch (err) {
    console.warn("[kvkLookup] KvK API error:", err instanceof Error ? err.message : err);
    return { found: false };
  } finally {
    clearTimeout(timeout);
  }
}

/** Extract structured address from KvK API response */
function extractAddress(data: Record<string, unknown>): {
  street?: string;
  city?: string;
  postalCode?: string;
} | null {
  try {
    // Try embedded main location first
    const embedded = data._embedded as Record<string, unknown> | undefined;
    const hoofdvestiging = embedded?.hoofdvestiging as Record<string, unknown> | undefined;
    const adressen = (hoofdvestiging?.adressen ?? data.adressen) as Array<Record<string, unknown>> | undefined;

    if (!adressen?.length) return null;

    // Prefer "bezoekadres" (visiting address) over "postadres" (mailing address)
    const addr =
      adressen.find((a) => a.type === "bezoekadres") ?? adressen[0];

    const street = [addr.straatnaam, addr.huisnummer, addr.huisnummertoevoeging]
      .filter(Boolean)
      .join(" ");

    return {
      street: street || undefined,
      city: (addr.plaats as string) || undefined,
      postalCode: (addr.postcode as string) || undefined,
    };
  } catch {
    return null;
  }
}
