import { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getBranding, DEFAULT_BRANDING, type Branding } from "@/lib/branding";
import DashboardShell, { type ShellUser } from "@/components/dashboard/DashboardShell";

/**
 * Shared server layout for all authenticated app sections
 * (/dashboard, /scans, /sites, /settings, /teams).
 * Auth is intentionally tolerant here — each page keeps enforcing its own
 * auth/redirect rules, so the shell never blocks public or error states.
 */
export default async function ShellLayout({ children }: { children: ReactNode }) {
  let user: ShellUser | null = null;
  let branding: Branding = DEFAULT_BRANDING;

  try {
    const u = await getCurrentUser();
    user = {
      email: u.email,
      name: [u.firstName, u.lastName].filter(Boolean).join(" ") || null,
      isAdmin: !!u.isAdmin,
    };
    branding = await getBranding(u.id, u.plan);
  } catch {
    // Unauthenticated — render shell without user; the page will redirect.
  }

  return (
    <DashboardShell user={user} branding={branding}>
      {children}
    </DashboardShell>
  );
}
