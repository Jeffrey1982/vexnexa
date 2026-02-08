/**
 * Server-side helper for fetching admin API routes with ADMIN_DASH_SECRET.
 * Only used in Server Components — never imported on the client.
 */

const ADMIN_SECRET: string = process.env.ADMIN_DASH_SECRET ?? "";

function getBaseUrl(): string {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  return "http://localhost:3000";
}

export async function adminFetch<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const base = getBaseUrl();
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "x-admin-secret": ADMIN_SECRET,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`[adminFetch] ${path} failed:`, res.status, text);
    throw new Error(`Admin API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

export function hasAdminSecret(): boolean {
  return !!process.env.ADMIN_DASH_SECRET;
}
