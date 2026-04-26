import { cookies } from "next/headers";

/**
 * Server-side helper for fetching admin API routes with the current session.
 * Only used in Server Components - never imported on the client.
 */

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
  const cookieHeader = (await cookies()).toString();

  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      Cookie: cookieHeader,
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
