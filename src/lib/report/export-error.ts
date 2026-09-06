import { NextResponse } from "next/server";

/** Keep entitlement failures explicit without turning them into renderer errors. */
export function exportAccessErrorResponse(error: unknown, fallbackMessage = "Export access denied"): NextResponse | null {
  const detail = error as { code?: string; feature?: string; subscriptionStatus?: string; limit?: number; current?: number } | null;
  const message = error instanceof Error ? error.message : fallbackMessage;
  if (message === "Authentication required") {
    return NextResponse.json({ error: message }, { status: 401 });
  }
  if (detail?.code && ["UPGRADE_REQUIRED", "SUBSCRIPTION_INACTIVE", "LIMIT_REACHED", "FREE_LIMIT_REACHED"].includes(detail.code)) {
    const status = detail.code.endsWith("LIMIT_REACHED") ? 429 : 402;
    return NextResponse.json({ error: message, code: detail.code, feature: detail.feature, subscriptionStatus: detail.subscriptionStatus, limit: detail.limit, current: detail.current }, { status });
  }
  return null;
}
