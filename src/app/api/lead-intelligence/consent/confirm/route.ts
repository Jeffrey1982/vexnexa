import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { confirmLeadConsentToken } from "@/lib/lead-intelligence/repository";

export const runtime = "nodejs";

const TokenSchema = z.string().min(32).max(256);

export async function GET(request: NextRequest) {
  const token = TokenSchema.safeParse(request.nextUrl.searchParams.get("token"));
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  if (!token.success) {
    return NextResponse.redirect(`${appUrl}/free-scan?consent=invalid`);
  }

  try {
    const result = await confirmLeadConsentToken(token.data);
    return NextResponse.redirect(
      `${appUrl}/free-scan?consent=${result.confirmed ? "confirmed" : "invalid"}`,
    );
  } catch (error) {
    console.error("[lead-consent] Confirmation failed:", error);
    return NextResponse.redirect(`${appUrl}/free-scan?consent=error`);
  }
}
