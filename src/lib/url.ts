export function normalizeUrl(input: string): string | null {
  try {
    const raw = (input ?? "").trim();

    if (!raw) {
      return null;
    }

    const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const u = new URL(withProto);

    if (!isLikelyWebsiteHostname(u.hostname)) {
      return null;
    }

    return `${u.origin}${u.pathname || "/"}`;
  } catch {
    return null;
  }
}

function isLikelyWebsiteHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();

  if (!normalized || normalized === "localhost" || normalized.includes("..")) {
    return false;
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(normalized)) {
    return normalized
      .split(".")
      .every((octet) => Number(octet) >= 0 && Number(octet) <= 255);
  }

  const labels = normalized.split(".");

  return (
    labels.length >= 2 &&
    labels.every((label) => /^[a-z0-9-]+$/.test(label) && !label.startsWith("-") && !label.endsWith("-")) &&
    /^[a-z]{2,63}$/.test(labels[labels.length - 1])
  );
}
