import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server-new";
import { lookupKvk } from "@/lib/company/kvkLookup";

/**
 * POST /api/billing/kvk-lookup
 *
 * Looks up a Dutch company by KvK number and returns
 * company name + address for auto-fill.
 *
 * Requires authentication. KVK_API_KEY must be configured.
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
    const kvkNumber: string = (body.kvkNumber ?? "").replace(/\D/g, "");

    if (!kvkNumber || kvkNumber.length !== 8) {
      return NextResponse.json(
        { found: false, error: "KvK number must be 8 digits" },
        { status: 400 }
      );
    }

    const result = await lookupKvk(kvkNumber);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[kvk-lookup] Error:", error);
    return NextResponse.json(
      { found: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
