import { requireAdminAPI } from "@/lib/auth";

/**
 * Assert that the request is from an admin.
 * Uses the same Supabase session + database admin checks as other admin APIs.
 * Throws if not authorized.
 */
export async function assertAdmin(): Promise<void> {
  await requireAdminAPI();
}
