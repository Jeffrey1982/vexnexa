import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { unsubscribeLeadNurture } from "@/lib/lead-intelligence/nurture-service";

const TokenSchema = z.string().min(32).max(256);

async function unsubscribe(request: NextRequest) {
  const tokenValue = request.nextUrl.searchParams.get("token") ??
    (await request.formData().catch(() => null))?.get("token");
  const token = TokenSchema.safeParse(tokenValue);
  if (!token.success) return NextResponse.json({ ok: false }, { status: 400 });
  const removed = await unsubscribeLeadNurture(token.data);
  if (request.method === "POST") return NextResponse.json({ ok: removed });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  return NextResponse.redirect(`${appUrl}/?unsubscribe=${removed ? "success" : "invalid"}`);
}

export const GET = unsubscribe;
export const POST = unsubscribe;

