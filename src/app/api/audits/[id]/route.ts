import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/audits/[id] - Get a single audit with all items
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    const audit = await prisma.manualAudit.findFirst({
      where: {
        id: params.id,
        OR: [
          { createdById: user.id },
          { assignedToId: user.id },
          { reviewedById: user.id }
        ]
      },
      include: {
        site: { select: { url: true } },
        scan: {
          select: {
            score: true,
            issues: true,
            wcagAACompliance: true,
            wcagAAACompliance: true
          }
        },
        template: { select: { name: true, wcagLevel: true, description: true } },
        createdBy: { select: { email: true, firstName: true, lastName: true } },
        assignedTo: { select: { email: true, firstName: true, lastName: true } },
        reviewedBy: { select: { email: true, firstName: true, lastName: true } },
        items: {
          orderBy: [
            { category: "asc" },
            { priority: "desc" }
          ],
          include: {
            testedBy: { select: { email: true, firstName: true, lastName: true } }
          }
        },
        attachments: {
          include: {
            uploadedBy: { select: { email: true, firstName: true, lastName: true } }
          }
        }
      }
    });

    if (!audit) {
      return NextResponse.json(
        { ok: false, error: "Audit not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, audit });
  } catch (e: any) {
    console.error("Failed to fetch audit:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Failed to fetch audit" },
      { status: 500 }
    );
  }
}

// PATCH /api/audits/[id] - Update audit metadata
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const { status, name, description, dueDate, reviewedById } = body;

    // Verify user has access to audit
    const existing = await prisma.manualAudit.findFirst({
      where: {
        id: params.id,
        OR: [
          { createdById: user.id },
          { assignedToId: user.id }
        ]
      }
    });

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Audit not found or access denied" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (reviewedById !== undefined) updateData.reviewedById = reviewedById;

    // Update timestamps based on status
    if (status === "in_progress" && !existing.startedAt) {
      updateData.startedAt = new Date();
    }
    if (status === "completed" && !existing.completedAt) {
      updateData.completedAt = new Date();
    }
    if (reviewedById && !existing.reviewedAt) {
      updateData.reviewedAt = new Date();
    }

    const audit = await prisma.manualAudit.update({
      where: { id: params.id },
      data: updateData
    });

    return NextResponse.json({ ok: true, audit });
  } catch (e: any) {
    console.error("Failed to update audit:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Failed to update audit" },
      { status: 500 }
    );
  }
}
