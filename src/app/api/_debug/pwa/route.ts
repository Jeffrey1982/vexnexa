import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    ok: true,
    ts: new Date().toISOString(),
    note: "If you see this JSON, the service worker is NOT intercepting /api/* requests.",
  });
}
