import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" } as const;

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    assertAdmin(req);

    const url = new URL(req.url);
    const limit: number = Math.min(Number(url.searchParams.get("limit") || "50"), 200);
    const offset: number = Number(url.searchParams.get("offset") || "0");
    const eventType: string | null = url.searchParams.get("event_type");
    const messageId: string | null = url.searchParams.get("message_id");

    let qb = supabaseAdmin
      .from("email_events")
      .select("*", { count: "exact" })
      .order("occurred_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (eventType) qb = qb.eq("event_type", eventType);
    if (messageId) qb = qb.eq("mailgun_message_id", messageId);

    const { data, count, error } = await qb;

    if (error) {
      console.error("[admin/email/events] query error:", error);
      return NextResponse.json({ error: "Failed to query events" }, { status: 500, headers: NO_STORE });
    }

    return NextResponse.json({ events: data ?? [], total: count ?? 0, limit, offset }, { headers: NO_STORE });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: message }, { status: 401, headers: NO_STORE });
    }
    console.error("[admin/email/events] Error:", message);
    return NextResponse.json({ error: message }, { status: 500, headers: NO_STORE });
  }
}
