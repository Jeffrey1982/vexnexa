import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: true,
      ts: new Date().toISOString(),
      host: req.headers.get("host") ?? "unknown",
      url: req.url,
      note: "If you see this JSON, the service worker is NOT intercepting /api/* requests.",
    },
    {
      headers: { "Cache-Control": "no-store" },
    }
  );
}
