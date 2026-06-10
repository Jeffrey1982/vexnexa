/**
 * Pending scan URL — captured on the marketing hero before signup,
 * consumed by the first scan form the user sees after registering
 * (dashboard NewScanForm or /sites/new).
 */
const PENDING_SCAN_URL_KEY = "vn-pending-scan-url";

export function setPendingScanUrl(url: string): void {
  try {
    window.localStorage.setItem(PENDING_SCAN_URL_KEY, url);
  } catch {
    // Storage unavailable (private mode / blocked) — flow degrades gracefully.
  }
}

/** Returns the stored URL and clears it, or null when nothing is pending. */
export function consumePendingScanUrl(): string | null {
  try {
    const url = window.localStorage.getItem(PENDING_SCAN_URL_KEY);
    if (url) window.localStorage.removeItem(PENDING_SCAN_URL_KEY);
    return url;
  } catch {
    return null;
  }
}
