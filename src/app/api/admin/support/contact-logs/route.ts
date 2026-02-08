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
    const query: string | null = url.searchParams.get("query");

    let qb = supabaseAdmin
      .from("contact_form_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (query) {
      qb = qb.or(`email.ilike.%${query}%,name.ilike.%${query}%,message.ilike.%${query}%`);
    }

    const { data, count, error } = await qb;

    if (error) {
      console.error("[admin/support/contact-logs] query error:", error);
      return NextResponse.json({ error: "Failed to query contact logs" }, { status: 500, headers: NO_STORE });
    }

    return NextResponse.json({ logs: data ?? [], total: count ?? 0, limit, offset }, { headers: NO_STORE });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: message }, { status: 401, headers: NO_STORE });
    }
    return NextResponse.json({ error: message }, { status: 500, headers: NO_STORE });
  }
}
