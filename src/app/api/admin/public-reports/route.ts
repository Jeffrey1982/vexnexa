import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAPI } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/public-reports
 * List public report sites with pagination.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdminAPI();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = (page - 1) * limit;
    const search = searchParams.get('search') || '';

    let sites: any[];
    let total: any[];

    if (search) {
      sites = await prisma.$queryRaw<any[]>`
        SELECT s.*, r.score as latest_score, r.issues_total as latest_issues
        FROM public_scan_sites s
        LEFT JOIN public_scan_reports r ON r.id = s.latest_public_report_id
        WHERE s.normalized_domain ILIKE ${'%' + search + '%'}
        ORDER BY s.last_scanned_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      total = await prisma.$queryRaw<any[]>`
        SELECT COUNT(*)::int as count FROM public_scan_sites
        WHERE normalized_domain ILIKE ${'%' + search + '%'}
      `;
    } else {
      sites = await prisma.$queryRaw<any[]>`
        SELECT s.*, r.score as latest_score, r.issues_total as latest_issues
        FROM public_scan_sites s
        LEFT JOIN public_scan_reports r ON r.id = s.latest_public_report_id
        ORDER BY s.last_scanned_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      total = await prisma.$queryRaw<any[]>`
        SELECT COUNT(*)::int as count FROM public_scan_sites
      `;
    }

    return NextResponse.json({
      sites,
      total: total[0]?.count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('[Admin Public Reports] GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/public-reports
 * Toggle public visibility for a domain.
 * Body: { siteId: string, publicPageEnabled: boolean }
 */
export async function PATCH(request: NextRequest) {
  try {
    await requireAdminAPI();

    const body = await request.json();
    const { siteId, publicPageEnabled } = body;

    if (!siteId || typeof publicPageEnabled !== 'boolean') {
      return NextResponse.json(
        { error: 'siteId and publicPageEnabled (boolean) are required' },
        { status: 400 }
      );
    }

    await prisma.$executeRaw`
      UPDATE public_scan_sites
      SET public_page_enabled = ${publicPageEnabled},
          updated_at = NOW()
      WHERE id = ${siteId}
    `;

    return NextResponse.json({ success: true, siteId, publicPageEnabled });
  } catch (error) {
    console.error('[Admin Public Reports] PATCH error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/public-reports
 * Remove all public reports for a domain (denylist / takedown).
 * Body: { siteId: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    await requireAdminAPI();

    const body = await request.json();
    const { siteId } = body;

    if (!siteId) {
      return NextResponse.json({ error: 'siteId is required' }, { status: 400 });
    }

    // Disable public page and remove latest report reference
    await prisma.$executeRaw`
      UPDATE public_scan_sites
      SET public_page_enabled = false,
          latest_public_report_id = NULL,
          updated_at = NOW()
      WHERE id = ${siteId}
    `;

    // Mark all reports as non-public and non-indexable
    await prisma.$executeRaw`
      UPDATE public_scan_reports
      SET is_public = false,
          allow_indexing = false,
          updated_at = NOW()
      WHERE site_id = ${siteId}
    `;

    return NextResponse.json({ success: true, siteId });
  } catch (error) {
    console.error('[Admin Public Reports] DELETE error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
