import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const SIGNING_KEY: string | undefined = process.env.MAILGUN_WEBHOOK_SIGNING_KEY;

/** Status-updating event types that should propagate to email_logs */
const STATUS_EVENTS = new Set([
  "delivered",
  "failed",
  "complained",
  "unsubscribed",
]);

/**
 * Map Mailgun event names to a simple status string for email_logs.
 */
function eventToStatus(eventType: string): string {
  switch (eventType) {
    case "delivered":
      return "delivered";
    case "failed":
      return "failed";
    case "complained":
      return "complained";
    case "unsubscribed":
      return "unsubscribed";
    default:
      return eventType;
  }
}

/**
 * Verify Mailgun webhook signature using HMAC SHA-256.
 * signature is valid if HMAC_SHA256(signing_key, timestamp + token) === signature.signature
 */
function verifySignature(
  sigTimestamp: string,
  sigToken: string,
  sigSignature: string
): boolean {
  if (!SIGNING_KEY) {
    console.error("[email/webhook] MAILGUN_WEBHOOK_SIGNING_KEY not set");
    return false;
  }

  const hmac = crypto.createHmac("sha256", SIGNING_KEY);
  hmac.update(sigTimestamp + sigToken);
  const digest: string = hmac.digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(digest, "hex"),
    Buffer.from(sigSignature, "hex")
  );
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = await req.json();

    // --- Signature verification ---
    const signature = body?.signature;
    if (
      !signature ||
      !signature.timestamp ||
      !signature.token ||
      !signature.signature
    ) {
      return NextResponse.json(
        { error: "Missing signature fields" },
        { status: 400 }
      );
    }

    const valid: boolean = verifySignature(
      String(signature.timestamp),
      String(signature.token),
      String(signature.signature)
    );

    if (!valid) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 403 }
      );
    }

    // --- Parse event data ---
    const eventData = body["event-data"] ?? body;
    const eventType: string = eventData?.event ?? "unknown";
    const severity: string | null = eventData?.severity ?? null;
    const reason: string | null = eventData?.reason ?? null;
    const recipient: string | null = eventData?.recipient ?? null;
    const timestamp: number = eventData?.timestamp
      ? Number(eventData.timestamp)
      : Date.now() / 1000;
    const occurredAt: string = new Date(timestamp * 1000).toISOString();

    // Extract message-id, stripping angle brackets
    const rawMessageId: string =
      eventData?.message?.headers?.["message-id"] ?? "";
    const messageId: string = rawMessageId.replace(/^<|>$/g, "");

    // --- Insert event row ---
    const { error: eventInsertError } = await supabaseAdmin
      .from("email_events")
      .insert({
        mailgun_message_id: messageId || null,
        event_type: eventType,
        severity,
        reason,
        recipient,
        occurred_at: occurredAt,
        payload: body,
      });

    if (eventInsertError) {
      console.error(
        "[email/webhook] Failed to insert email_events:",
        eventInsertError
      );
    }

    // --- Update email_logs for critical status events ---
    if (STATUS_EVENTS.has(eventType) && messageId) {
      const newStatus: string = eventToStatus(eventType);

      const { error: updateError } = await supabaseAdmin
        .from("email_logs")
        .update({
          status: newStatus,
          last_event_type: eventType,
          last_event_at: occurredAt,
        })
        .eq("mailgun_message_id", messageId);

      if (updateError) {
        console.error(
          "[email/webhook] Failed to update email_logs:",
          updateError
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown webhook error";
    console.error("[email/webhook] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
