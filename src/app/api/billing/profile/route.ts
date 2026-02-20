import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server-new";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const BillingProfileSchema = z.object({
  billingType: z.enum(["individual", "business"]),
  fullName: z.string().max(200).optional(),
  companyName: z.string().max(200).optional(),
  countryCode: z.string().length(2),
  vatId: z.string().max(50).optional(),
  kvkNumber: z.string().max(20).optional(),
  taxId: z.string().max(50).optional(),
  addressLine1: z.string().max(200).optional(),
  addressCity: z.string().max(100).optional(),
  addressPostal: z.string().max(20).optional(),
  addressRegion: z.string().max(100).optional(),
});

/**
 * GET /api/billing/profile — fetch current billing profile
 */
export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.billingProfile.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("[billing/profile] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/billing/profile — create or update billing profile
 */
export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = BillingProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Business requires companyName
    if (data.billingType === "business" && !data.companyName?.trim()) {
      return NextResponse.json(
        { error: "Company name is required for business billing" },
        { status: 400 }
      );
    }

    const profile = await prisma.billingProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        billingType: data.billingType,
        fullName: data.fullName || null,
        companyName: data.companyName || null,
        countryCode: data.countryCode.toUpperCase(),
        vatId: data.vatId || null,
        kvkNumber: data.kvkNumber || null,
        taxId: data.taxId || null,
        addressLine1: data.addressLine1 || null,
        addressCity: data.addressCity || null,
        addressPostal: data.addressPostal || null,
        addressRegion: data.addressRegion || null,
      },
      update: {
        billingType: data.billingType,
        fullName: data.fullName || null,
        companyName: data.companyName || null,
        countryCode: data.countryCode.toUpperCase(),
        vatId: data.vatId || null,
        kvkNumber: data.kvkNumber || null,
        taxId: data.taxId || null,
        addressLine1: data.addressLine1 || null,
        addressCity: data.addressCity || null,
        addressPostal: data.addressPostal || null,
        addressRegion: data.addressRegion || null,
      },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("[billing/profile] PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
