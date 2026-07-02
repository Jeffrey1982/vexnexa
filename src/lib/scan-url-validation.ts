/**
 * URL validation shared by scan endpoints.
 * Blocks non-http(s) protocols and internal/private network targets (SSRF).
 */
export function validatePublicUrl(url: string): { siteUrl: string; fullPageUrl: string } {
  const urlObj = new URL(url);

  if (!["http:", "https:"].includes(urlObj.protocol)) {
    throw Object.assign(new Error("Only http and https URLs are allowed"), { statusCode: 400 });
  }

  const hostname = urlObj.hostname.toLowerCase();
  const isBlocked =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname === "[::1]" ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    /^10\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^169\.254\./.test(hostname);

  if (isBlocked) {
    throw Object.assign(new Error("Scanning internal or private network addresses is not allowed"), { statusCode: 400 });
  }

  return {
    siteUrl: urlObj.origin,
    fullPageUrl: url,
  };
}
