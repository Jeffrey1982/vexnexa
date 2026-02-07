import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/audits - List all audits for the user
export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);

    const siteId = searchParams.get("siteId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {
      OR: [
        { createdById: user.id },
        { assignedToId: user.id },
        { reviewedById: user.id }
      ]
    };

    if (siteId) where.siteId = siteId;
    if (status) where.status = status;

    const audits = await prisma.manualAudit.findMany({
      where,
      include: {
        site: { select: { url: true } },
        scan: { select: { score: true, issues: true } },
        template: { select: { name: true, wcagLevel: true } },
        createdBy: { select: { email: true, firstName: true, lastName: true } },
        assignedTo: { select: { email: true, firstName: true, lastName: true } },
        _count: { select: { items: true } }
      },
      orderBy: { createdAt: "desc" },
      take: limit
    });

    return NextResponse.json({ ok: true, audits });
  } catch (e: any) {
    if (e?.message === "Authentication required") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to fetch audits:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Failed to fetch audits" },
      { status: 500 }
    );
  }
}

// POST /api/audits - Create a new manual audit
export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const { siteId, scanId, name, description, templateId, assignedToId } = body;

    if (!siteId || !name) {
      return NextResponse.json(
        { ok: false, error: "siteId and name are required" },
        { status: 400 }
      );
    }

    // Verify user has access to site
    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        userId: user.id
      }
    });

    if (!site) {
      return NextResponse.json(
        { ok: false, error: "Site not found or access denied" },
        { status: 404 }
      );
    }

    // Get template if specified
    let template = null;
    if (templateId) {
      template = await prisma.auditTemplate.findUnique({
        where: { id: templateId },
        include: { criteria: true }
      });
    }

    // Create audit
    const audit = await prisma.manualAudit.create({
      data: {
        siteId,
        scanId,
        name,
        description,
        templateId,
        createdById: user.id,
        assignedToId,
        status: "draft",
        totalCriteria: template?.criteria.length || 0
      }
    });

    // Create audit items from template criteria
    if (template && template.criteria.length > 0) {
      const items = template.criteria.map(criterion => ({
        auditId: audit.id,
        criterionId: criterion.id,
        category: criterion.category,
        subcategory: criterion.subcategory,
        title: criterion.title,
        description: criterion.description,
        howToTest: criterion.howToTest,
        wcagCriterion: criterion.wcagCriterion,
        wcagLevel: criterion.wcagLevel,
        wcagUrl: criterion.wcagUrl,
        priority: criterion.priority,
        status: "pending"
      }));

      await prisma.auditItem.createMany({ data: items });
    }

    return NextResponse.json({ ok: true, audit });
  } catch (e: any) {
    console.error("Failed to create audit:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Failed to create audit" },
      { status: 500 }
    );
  }
}
