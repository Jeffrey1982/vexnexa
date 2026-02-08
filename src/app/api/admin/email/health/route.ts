import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type Range = "24h" | "7d" | "30d";

const RANGE_HOURS: Record<Range, number> = {
  "24h": 24,
  "7d": 168,
  "30d": 720,
};

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    assertAdmin(req);

    const url = new URL(req.url);
    const rangeParam: string = url.searchParams.get("range") ?? "24h";
    const hours: number | undefined =
      RANGE_HOURS[rangeParam as Range];

    if (!hours) {
      return NextResponse.json(
        { error: "Invalid range. Use 24h, 7d, or 30d." },
        { status: 400 }
      );
    }

    const since: string = new Date(
      Date.now() - hours * 60 * 60 * 1000
    ).toISOString();

    // Count events by type within the range
    const { data: events, error: eventsError } = await supabaseAdmin
      .from("email_events")
      .select("event_type")
      .gte("occurred_at", since);

    if (eventsError) {
      console.error("[admin/email/health] events query error:", eventsError);
      return NextResponse.json(
        { error: "Failed to query events" },
        { status: 500 }
      );
    }

    const counts: Record<string, number> = {
      delivered: 0,
      failed: 0,
      opened: 0,
      clicked: 0,
      unsubscribed: 0,
      complained: 0,
    };

    for (const row of events ?? []) {
      const t: string = row.event_type;
      if (t in counts) {
        counts[t]++;
      }
    }

    // Total sent in range
    const { count: totalSent, error: sentError } = await supabaseAdmin
      .from("email_logs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since);

    if (sentError) {
      console.error("[admin/email/health] sent query error:", sentError);
    }

    return NextResponse.json({
      range: rangeParam,
      since,
      total_sent: totalSent ?? 0,
      delivered: counts.delivered,
      failed: counts.failed,
      opened: counts.opened,
      clicked: counts.clicked,
      unsubscribed: counts.unsubscribed,
      complained: counts.complained,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("[admin/email/health] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
