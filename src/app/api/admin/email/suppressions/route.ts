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
    const type: string | null = url.searchParams.get("type");

    let qb = supabaseAdmin
      .from("email_suppressions")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) qb = qb.eq("type", type);

    const { data, count, error } = await qb;

    if (error) {
      console.error("[admin/email/suppressions] query error:", error);
      return NextResponse.json({ error: "Failed to query suppressions" }, { status: 500, headers: NO_STORE });
    }

    return NextResponse.json({ suppressions: data ?? [], total: count ?? 0, limit, offset }, { headers: NO_STORE });
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
    const { email, type, reason } = body as { email?: string; type?: string; reason?: string };

    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400, headers: NO_STORE });
    }

    const { data, error } = await supabaseAdmin
      .from("email_suppressions")
      .insert({ email, type: type ?? "manual", reason: reason ?? null })
      .select()
      .single();

    if (error) {
      console.error("[admin/email/suppressions] insert error:", error);
      return NextResponse.json({ error: "Failed to add suppression" }, { status: 500, headers: NO_STORE });
    }

    return NextResponse.json({ suppression: data }, { status: 201, headers: NO_STORE });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: message }, { status: 401, headers: NO_STORE });
    }
    return NextResponse.json({ error: message }, { status: 500, headers: NO_STORE });
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    assertAdmin(req);

    const url = new URL(req.url);
    const id: string | null = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id query param is required" }, { status: 400, headers: NO_STORE });
    }

    const { error } = await supabaseAdmin
      .from("email_suppressions")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[admin/email/suppressions] delete error:", error);
      return NextResponse.json({ error: "Failed to remove suppression" }, { status: 500, headers: NO_STORE });
    }

    return NextResponse.json({ success: true }, { headers: NO_STORE });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: message }, { status: 401, headers: NO_STORE });
    }
    return NextResponse.json({ error: message }, { status: 500, headers: NO_STORE });
  }
}
