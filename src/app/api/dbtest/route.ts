import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";

export async function GET() {
  const users = await prisma.user.count();
  return NextResponse.json({ ok: true, users, time: new Date().toISOString() });
}