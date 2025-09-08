import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const raw = process.env.DATABASE_URL || "";
    const host = (() => {
      try { return new URL(raw.replace(/^postgres(ql)?:\/\//, "http://")).host; }
      catch { return "n/a"; }
    })();

    const rows = await prisma.$queryRaw`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema='public' ORDER BY 1
    `;

    return NextResponse.json({ ok: true, dbHost: host, tables: rows.map((r: any) => r.table_name) });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}