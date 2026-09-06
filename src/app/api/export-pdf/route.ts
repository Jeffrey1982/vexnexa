import { NextRequest, NextResponse } from "next/server";
import { POST as exportStoredScanPDF } from "@/app/api/export/pdf/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Legacy payload compatibility; exports always use authenticated server evidence. */
export async function POST(req: NextRequest) {
  let scanId: unknown;
  try {
    const body = await req.json();
    scanId = body?.scanId ?? body?.result?.scanId;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }
  if (typeof scanId !== "string" || !scanId.trim()) {
    return NextResponse.json({ error: "Scan ID is required" }, { status: 400 });
  }
  // Discard client-supplied scores, findings, HTML and branding. The canonical
  // route checks authentication, export rights, billing status and scan access.
  return exportStoredScanPDF(new NextRequest(req.url, {
    method: "POST",
    headers: req.headers,
    body: JSON.stringify({ scanId }),
  }));
}
