import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    assertAdmin(req);

    const url = new URL(req.url);
    const query: string | null = url.searchParams.get("query");
    const tag: string | null = url.searchParams.get("tag");
    const status: string | null = url.searchParams.get("status");
    const limit: number = Math.min(
      Number(url.searchParams.get("limit") || "50"),
      200
    );
    const offset: number = Number(url.searchParams.get("offset") || "0");

    let qb = supabaseAdmin
      .from("email_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by tag
    if (tag) {
      qb = qb.eq("tag", tag);
    }

    // Filter by status
    if (status) {
      qb = qb.eq("status", status);
    }

    // Free-text search: match against to_email, subject, or user_id
    if (query) {
      qb = qb.or(
        `to_email.ilike.%${query}%,subject.ilike.%${query}%,user_id.ilike.%${query}%`
      );
    }

    const { data, count, error } = await qb;

    if (error) {
      console.error("[admin/email/logs] query error:", error);
      return NextResponse.json(
        { error: "Failed to query email logs" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      logs: data ?? [],
      total: count ?? 0,
      limit,
      offset,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("[admin/email/logs] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
