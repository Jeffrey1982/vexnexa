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
    const status: string | null = url.searchParams.get("status");
    const priority: string | null = url.searchParams.get("priority");
    const query: string | null = url.searchParams.get("query");

    let qb = supabaseAdmin
      .from("support_tickets")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) qb = qb.eq("status", status);
    if (priority) qb = qb.eq("priority", priority);
    if (query) {
      qb = qb.or(`email.ilike.%${query}%,subject.ilike.%${query}%`);
    }

    const { data, count, error } = await qb;

    if (error) {
      console.error("[admin/support/tickets] query error:", error);
      return NextResponse.json({ error: "Failed to query tickets" }, { status: 500, headers: NO_STORE });
    }

    return NextResponse.json({ tickets: data ?? [], total: count ?? 0, limit, offset }, { headers: NO_STORE });
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
    const { email, subject, user_id, priority } = body as {
      email?: string; subject?: string; user_id?: string; priority?: string;
    };

    if (!email || !subject) {
      return NextResponse.json({ error: "email and subject are required" }, { status: 400, headers: NO_STORE });
    }

    const { data, error } = await supabaseAdmin
      .from("support_tickets")
      .insert({
        email,
        subject,
        user_id: user_id ?? null,
        priority: priority ?? "normal",
        status: "open",
      })
      .select()
      .single();

    if (error) {
      console.error("[admin/support/tickets] insert error:", error);
      return NextResponse.json({ error: "Failed to create ticket" }, { status: 500, headers: NO_STORE });
    }

    return NextResponse.json({ ticket: data }, { status: 201, headers: NO_STORE });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: message }, { status: 401, headers: NO_STORE });
    }
    return NextResponse.json({ error: message }, { status: 500, headers: NO_STORE });
  }
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    assertAdmin(req);

    const body = await req.json();
    const { id, status, priority } = body as { id?: string; status?: string; priority?: string };

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400, headers: NO_STORE });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;

    const { data, error } = await supabaseAdmin
      .from("support_tickets")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[admin/support/tickets] update error:", error);
      return NextResponse.json({ error: "Failed to update ticket" }, { status: 500, headers: NO_STORE });
    }

    return NextResponse.json({ ticket: data }, { headers: NO_STORE });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: message }, { status: 401, headers: NO_STORE });
    }
    return NextResponse.json({ error: message }, { status: 500, headers: NO_STORE });
  }
}
