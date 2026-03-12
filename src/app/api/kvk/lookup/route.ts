import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server-new";
import { lookupKvk } from "@/lib/company/kvkLookup";

/**
 * POST /api/kvk/lookup
 *
 * Looks up a Dutch company by KvK number and returns
 * normalized company details for auto-fill.
 *
 * Request body: { kvk: string }
 *
 * Success response:
 *   { found: true, name: string, street: string, postalCode: string, city: string, country: "NL" }
 *
 * Not-found response:
 *   { found: false }
 *
 * Requires authentication. KVK_API_KEY must be configured server-side.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const kvkRaw: string = String(body.kvk ?? "").replace(/\D/g, "");

    if (!kvkRaw || kvkRaw.length !== 8) {
      return NextResponse.json(
        { found: false, error: "KvK number must be 8 digits" },
        { status: 400 }
      );
    }

    const result = await lookupKvk(kvkRaw);

    if (!result.found) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({
      found: true,
      name: result.companyName ?? "",
      street: result.street ?? "",
      postalCode: result.postalCode ?? "",
      city: result.city ?? "",
      country: "NL" as const,
    });
  } catch (error) {
    console.error("[kvk/lookup] Error:", error);
    return NextResponse.json(
      { found: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
