const DOMAIN_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export class DomainNormalizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainNormalizationError";
  }
}

export function normalizeDomain(input: string): string {
  const raw = input.trim();
  if (!raw) {
    throw new DomainNormalizationError("Domain is required.");
  }
  if (/[\s@]/.test(raw)) {
    throw new DomainNormalizationError("Domain cannot contain whitespace or @.");
  }

  const withProtocol = /^[a-z][a-z\d+\-.]*:\/\//i.test(raw)
    ? raw
    : `https://${raw}`;

  let host: string;
  try {
    host = new URL(withProtocol).hostname;
  } catch {
    throw new DomainNormalizationError("Domain is malformed.");
  }

  const normalized = host.toLowerCase().replace(/\.$/, "");
  const withoutWww = normalized.startsWith("www.") ? normalized.slice(4) : normalized;
  const labels = withoutWww.split(".");

  if (
    labels.length < 2 ||
    withoutWww.length > 253 ||
    labels.some((label) => !DOMAIN_LABEL.test(label)) ||
    labels.at(-1)!.length < 2 ||
    /^\d+\.\d+\.\d+\.\d+$/.test(withoutWww)
  ) {
    throw new DomainNormalizationError("Domain is malformed.");
  }

  return withoutWww;
}

export function normalizeEmail(input: string): string {
  const email = input.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new DomainNormalizationError("Email is malformed.");
  }
  normalizeDomain(email.split("@")[1] ?? "");
  return email;
}
