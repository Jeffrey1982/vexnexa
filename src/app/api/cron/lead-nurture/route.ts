import { NextRequest, NextResponse } from "next/server";
import { withCronAuth } from "@/lib/cron-auth";
import { runLeadNurtureBatch } from "@/lib/lead-intelligence/nurture-service";

export const runtime = "nodejs";
export const maxDuration = 120;

async function handler(_request: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: false, error: "Email service not configured" }, { status: 503 });
  }
  const results = await runLeadNurtureBatch({ limit: 25 });
  return NextResponse.json({ ok: true, processed: results.length, results });
}

export const GET = withCronAuth(handler);
export const POST = withCronAuth(handler);

