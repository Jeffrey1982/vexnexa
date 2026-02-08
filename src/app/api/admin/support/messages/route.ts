import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" } as const;

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    assertAdmin(req);

    const url = new URL(req.url);
    const ticketId: string | null = url.searchParams.get("ticket_id");
    const limit: number = Math.min(Number(url.searchParams.get("limit") || "100"), 500);
    const offset: number = Number(url.searchParams.get("offset") || "0");

    if (!ticketId) {
      return NextResponse.json({ error: "ticket_id is required" }, { status: 400, headers: NO_STORE });
    }

    const { data, count, error } = await supabaseAdmin
      .from("support_messages")
      .select("*", { count: "exact" })
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[admin/support/messages] query error:", error);
      return NextResponse.json({ error: "Failed to query messages" }, { status: 500, headers: NO_STORE });
    }

    return NextResponse.json({ messages: data ?? [], total: count ?? 0 }, { headers: NO_STORE });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: message }, { status: 401, headers: NO_STORE });
    }
    return NextResponse.json({ error: message }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    assertAdmin(req);

    const body = await req.json();
    const { ticket_id, from_email, body: msgBody } = body as {
      ticket_id?: string; from_email?: string; body?: string;
    };

    if (!ticket_id || !from_email || !msgBody) {
      return NextResponse.json(
        { error: "ticket_id, from_email, and body are required" },
        { status: 400, headers: NO_STORE }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("support_messages")
      .insert({ ticket_id, from_email, body: msgBody })
      .select()
      .single();

    if (error) {
      console.error("[admin/support/messages] insert error:", error);
      return NextResponse.json({ error: "Failed to create message" }, { status: 500, headers: NO_STORE });
    }

    return NextResponse.json({ message: data }, { status: 201, headers: NO_STORE });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: message }, { status: 401, headers: NO_STORE });
    }
    return NextResponse.json({ error: message }, { status: 500, headers: NO_STORE });
  }
}
