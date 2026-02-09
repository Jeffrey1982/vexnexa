import { validateImageUrl } from "./resolve-white-label";

const FETCH_TIMEOUT_MS = 5000;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB

/**
 * Fetch a remote image and return as a data URL (base64).
 * Returns empty string on failure (caller should show initials fallback).
 */
export async function fetchImageAsDataUrl(url: string): Promise<string> {
  const validated = validateImageUrl(url);
  if (!validated) return "";

  // Already a data URL — no need to fetch
  if (validated.startsWith("data:")) return validated;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const res = await fetch(validated, {
      signal: controller.signal,
      headers: { Accept: "image/*" },
    });
    clearTimeout(timeout);

    if (!res.ok) return "";

    const ct = res.headers.get("Content-Type") ?? "image/png";
    if (!ct.startsWith("image/")) return "";

    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_IMAGE_BYTES) return "";

    const base64 = Buffer.from(buf).toString("base64");
    return `data:${ct};base64,${base64}`;
  } catch {
    return "";
  }
}

/**
 * Fetch a remote image and return as a Buffer (for DOCX ImageRun).
 * Returns null on failure.
 */
export async function fetchImageAsBuffer(url: string): Promise<Buffer | null> {
  const validated = validateImageUrl(url);
  if (!validated) return null;

  // Already a data URL — decode base64 directly
  if (validated.startsWith("data:")) {
    try {
      const base64 = validated.split(",")[1];
      if (!base64) return null;
      return Buffer.from(base64, "base64");
    } catch {
      return null;
    }
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const res = await fetch(validated, {
      signal: controller.signal,
      headers: { Accept: "image/*" },
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const ct = res.headers.get("Content-Type") ?? "";
    if (!ct.startsWith("image/")) return null;

    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_IMAGE_BYTES) return null;

    return Buffer.from(buf);
  } catch {
    return null;
  }
}
