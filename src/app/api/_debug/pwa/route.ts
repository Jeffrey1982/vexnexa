import { NextRequest, NextResponse } from "next/server";
import { requireDevelopment } from "@/lib/dev-only";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const devCheck = requireDevelopment();
  if (devCheck) return devCheck;

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
