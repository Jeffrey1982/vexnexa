import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAPI } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const VALID_GRANT_TYPES = [
  'PLAN_TRIAL',
  'PLAN_STARTER',
  'PLAN_PRO',
  'PLAN_BUSINESS',
  'FREE_SCANS',
] as const;

type GrantType = (typeof VALID_GRANT_TYPES)[number];

function generateCode(length: number = 8): string {
  return crypto
    .randomBytes(length)
    .toString('base64url')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, length);
}

// GET /api/admin/coupons — list all coupons
export async function GET(request: NextRequest) {
  try {
    await requireAdminAPI();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status'); // 'active' | 'expired' | 'all'

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status === 'active') {
      where.isActive = true;
      where.AND = [
        {
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      ];
    } else if (status === 'expired') {
      where.OR = [
        { isActive: false },
        { expiresAt: { lte: new Date() } },
      ];
    }

    const coupons = await prisma.coupon.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        _count: {
          select: { redemptions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, coupons });
  } catch (error: unknown) {
    console.error('List coupons error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/admin/coupons — create a new coupon
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminAPI();

    const body = await request.json();
    const {
      code,
      name,
      description,
      grantType,
      grantValue,
      maxRedemptions,
      perUserLimit = 1,
      startsAt,
      expiresAt,
      isActive = true,
      generateCodeFlag,
    } = body as {
      code?: string;
      name?: string;
      description?: string;
      grantType: string;
      grantValue: string;
      maxRedemptions?: number | null;
      perUserLimit?: number;
      startsAt?: string | null;
      expiresAt?: string | null;
      isActive?: boolean;
      generateCodeFlag?: boolean;
    };

    // Validate grant type
    if (!grantType || !VALID_GRANT_TYPES.includes(grantType as GrantType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid grant type' },
        { status: 400 }
      );
    }

    if (!grantValue) {
      return NextResponse.json(
        { success: false, error: 'Grant value is required' },
        { status: 400 }
      );
    }

    // Resolve code
    const finalCode = generateCodeFlag || !code
      ? generateCode()
      : code.toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (finalCode.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Code must be at least 3 characters' },
        { status: 400 }
      );
    }

    // Check uniqueness
    const existing = await prisma.coupon.findUnique({ where: { code: finalCode } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Code "${finalCode}" already exists` },
        { status: 409 }
      );
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: finalCode,
        name: name || null,
        description: description || null,
        grantType: grantType as GrantType,
        grantValue: String(grantValue),
        maxRedemptions: maxRedemptions ?? null,
        perUserLimit,
        startsAt: startsAt ? new Date(startsAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive,
        createdBy: admin.id,
      },
    });

    return NextResponse.json({ success: true, coupon }, { status: 201 });
  } catch (error: unknown) {
    console.error('Create coupon error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
