export function normalizeUrl(input: string): string | null {
  try {
    const raw = (input ?? "").trim();
    const withProto = raw.startsWith("http://") || raw.startsWith("https://")
      ? raw
      : `https://${raw}`;
    const u = new URL(withProto);
    return `${u.origin}${u.pathname || "/"}`;
  } catch {
    return null;
  }
}