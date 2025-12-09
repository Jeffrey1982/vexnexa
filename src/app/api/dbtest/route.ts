import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDevelopment } from '@/lib/dev-only'
export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

export async function GET() {
  const devCheck = requireDevelopment()
  if (devCheck) return devCheck


  const users = await prisma.user.count();
  return NextResponse.json({ ok: true, users, time: new Date().toISOString() });
}