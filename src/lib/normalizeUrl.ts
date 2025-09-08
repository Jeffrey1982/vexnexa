export function normalizeUrl(u: string): string {
  try {
    const url = new URL(u);
    // Alleen http/https
    if (!/^https?:$/.test(url.protocol)) throw new Error("Unsupported protocol");
    // Normaliseer: zonder hash, sorteer zoekparams, lowercase host
    url.hash = "";
    url.host = url.host.toLowerCase();
    url.searchParams.sort();
    return url.toString();
  } catch {
    return u.trim();
  }
}

export function sameOrigin(a: string, b: string) {
  try {
    const A = new URL(a);
    const B = new URL(b);
    return A.origin === B.origin;
  } catch {
    return false;
  }
}