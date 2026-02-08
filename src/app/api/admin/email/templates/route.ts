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

    const { data, count, error } = await supabaseAdmin
      .from("email_templates")
      .select("*", { count: "exact" })
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[admin/email/templates] query error:", error);
      return NextResponse.json({ error: "Failed to query templates" }, { status: 500, headers: NO_STORE });
    }

    return NextResponse.json({ templates: data ?? [], total: count ?? 0, limit, offset }, { headers: NO_STORE });
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
    const { name, subject, html, text, variables } = body as {
      name?: string; subject?: string; html?: string; text?: string; variables?: unknown;
    };

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400, headers: NO_STORE });
    }

    const { data, error } = await supabaseAdmin
      .from("email_templates")
      .insert({
        name,
        subject: subject ?? "",
        html: html ?? "",
        text: text ?? "",
        variables: variables ?? [],
      })
      .select()
      .single();

    if (error) {
      console.error("[admin/email/templates] insert error:", error);
      return NextResponse.json({ error: "Failed to create template" }, { status: 500, headers: NO_STORE });
    }

    return NextResponse.json({ template: data }, { status: 201, headers: NO_STORE });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: message }, { status: 401, headers: NO_STORE });
    }
    return NextResponse.json({ error: message }, { status: 500, headers: NO_STORE });
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    assertAdmin(req);

    const body = await req.json();
    const { id, name, subject, html, text, variables } = body as {
      id?: string; name?: string; subject?: string; html?: string; text?: string; variables?: unknown;
    };

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400, headers: NO_STORE });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (subject !== undefined) updates.subject = subject;
    if (html !== undefined) updates.html = html;
    if (text !== undefined) updates.text = text;
    if (variables !== undefined) updates.variables = variables;

    const { data, error } = await supabaseAdmin
      .from("email_templates")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[admin/email/templates] update error:", error);
      return NextResponse.json({ error: "Failed to update template" }, { status: 500, headers: NO_STORE });
    }

    return NextResponse.json({ template: data }, { headers: NO_STORE });
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
      .from("email_templates")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[admin/email/templates] delete error:", error);
      return NextResponse.json({ error: "Failed to delete template" }, { status: 500, headers: NO_STORE });
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
