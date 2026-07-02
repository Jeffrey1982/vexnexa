import { NextResponse } from "next/server";
import { getLeadCaptureStorageHealth } from "@/lib/lead-intelligence/repository";

export const runtime = "nodejs";

export async function GET() {
  let leadCapture = { configured: false, reachable: false };
  try {
    leadCapture = await getLeadCaptureStorageHealth();
  } catch {
    leadCapture = { configured: true, reachable: false };
  }

  return NextResponse.json({
    ok: true,
    time: new Date().toISOString(),
    checks: {
      leadCapture,
    },
  });
}
