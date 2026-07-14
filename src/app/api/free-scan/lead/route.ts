import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, FREE_SCAN_LEAD_LIMIT } from "@/lib/rate-limit";
import { normalizeUrl } from "@/lib/url";
import { validatePublicUrl } from "@/lib/scan-url-validation";
import { sendFreeScanLeadEmails } from "@/lib/email";
import {
  createFreeScanConsentRequest,
  recordFreeScanLeadCapture,
} from "@/lib/lead-intelligence/repository";
import { createConsentToken } from "@/lib/lead-intelligence/consent-tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const count = z.coerce.number().int().min(0).max(100000);

const LeadSchema = z.object({
  email: z.string().trim().email().max(254),
  url: z.string().trim().min(1).max(2000),
  phase: z.enum(["done", "error", "rate_limited"]),
  locale: z.enum(["en", "nl", "de", "fr", "es", "pt"]).default("en"),
  marketingConsent: z.boolean().default(false),
  result: z
    .object({
      score: z.coerce.number().int().min(0).max(100),
      totalIssues: count,
      impactCritical: count,
      impactSerious: count,
      impactModerate: count,
      impactMinor: count,
    })
    .optional(),
});

/**
 * Free-scan lead capture. No persistence yet — the visitor gets their
 * (partial) result or a follow-up promise by email, and every lead is
 * forwarded to the founder inbox. All result values are re-validated and
 * clamped server-side; the email templates are fully server-controlled.
 */
export async function POST(req: NextRequest) {
  const limit = await checkRateLimit(req, FREE_SCAN_LEAD_LIMIT);
  if (!limit.success) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Try again later." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = LeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  const { email, phase, locale, result, marketingConsent } = parsed.data;

  const normalized = normalizeUrl(parsed.data.url);
  if (!normalized) {
    return NextResponse.json(
      { ok: false, error: "Invalid website URL." },
      { status: 400 }
    );
  }
  let fullPageUrl: string;
  try {
    ({ fullPageUrl } = validatePublicUrl(normalized));
  } catch (urlError: any) {
    return NextResponse.json(
      { ok: false, error: urlError?.message || "Invalid website URL." },
      { status: urlError?.statusCode || 400 }
    );
  }

  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const storedPhase = phase === "done" && !result ? "error" : phase;
  let confirmMarketingUrl: string | undefined;

  try {
    const capture = await recordFreeScanLeadCapture({
      email,
      url: fullPageUrl,
      phase: storedPhase,
      locale,
      clientIp,
      result,
    });
    if (marketingConsent && capture.stored) {
      const token = createConsentToken();
      await createFreeScanConsentRequest({
        capture,
        token,
        locale,
        clientIp,
        userAgent: req.headers.get("user-agent") || "unknown",
      });
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vexnexa.com";
      confirmMarketingUrl = `${appUrl}/api/lead-intelligence/consent/confirm?token=${encodeURIComponent(token)}`;
    }
  } catch (error) {
    console.error("[free-scan-lead] Persistence failed:", error);
  }

  try {
    const sendResult = await sendFreeScanLeadEmails({
      email,
      url: fullPageUrl,
      phase: storedPhase,
      locale,
      clientIp,
      result,
      confirmMarketingUrl,
    });

    if (sendResult && (sendResult as any).error) {
      console.error("[free-scan-lead] Resend error:", (sendResult as any).error);
      return NextResponse.json(
        { ok: false, error: "Email could not be sent. Please try again." },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("[free-scan-lead] Send failed:", error);
    return NextResponse.json(
      { ok: false, error: "Email could not be sent. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
