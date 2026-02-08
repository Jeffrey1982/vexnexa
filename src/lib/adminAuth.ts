import { NextRequest } from "next/server";

const ADMIN_DASH_SECRET: string | undefined = process.env.ADMIN_DASH_SECRET;

/**
 * Assert that the request is from an admin.
 * Currently checks the `x-admin-secret` header against ADMIN_DASH_SECRET.
 * Throws if not authorized.
 */
export function assertAdmin(req: NextRequest): void {
  if (!ADMIN_DASH_SECRET) {
    throw new Error(
      "ADMIN_DASH_SECRET environment variable is not configured."
    );
  }

  const secret = req.headers.get("x-admin-secret");

  if (secret !== ADMIN_DASH_SECRET) {
    throw new Error("Unauthorized: invalid admin secret.");
  }
}
