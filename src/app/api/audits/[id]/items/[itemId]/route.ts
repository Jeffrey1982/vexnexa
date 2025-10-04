import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PATCH /api/audits/[id]/items/[itemId] - Update an audit item (test result)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const {
      status,
      result,
      notes,
      screenshotUrls,
      elementSelector,
      pageUrl,
      remediationNotes,
      priority
    } = body;

    // Verify user has access to the audit
    const audit = await prisma.manualAudit.findFirst({
      where: {
        id: params.id,
        OR: [
          { createdById: user.id },
          { assignedToId: user.id }
        ]
      }
    });

    if (!audit) {
      return NextResponse.json(
        { ok: false, error: "Audit not found or access denied" },
        { status: 404 }
      );
    }

    // Verify item belongs to audit
    const existingItem = await prisma.auditItem.findFirst({
      where: {
        id: params.itemId,
        auditId: params.id
      }
    });

    if (!existingItem) {
      return NextResponse.json(
        { ok: false, error: "Audit item not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (result) updateData.result = result;
    if (notes !== undefined) updateData.notes = notes;
    if (screenshotUrls !== undefined) updateData.screenshotUrls = screenshotUrls;
    if (elementSelector !== undefined) updateData.elementSelector = elementSelector;
    if (pageUrl !== undefined) updateData.pageUrl = pageUrl;
    if (remediationNotes !== undefined) updateData.remediationNotes = remediationNotes;
    if (priority) updateData.priority = priority;

    // Mark as tested
    if (status === "tested" || result) {
      updateData.testedById = user.id;
      updateData.testedAt = new Date();
    }

    const item = await prisma.auditItem.update({
      where: { id: params.itemId },
      data: updateData
    });

    // Recalculate audit statistics
    const allItems = await prisma.auditItem.findMany({
      where: { auditId: params.id },
      select: { status: true, result: true }
    });

    const completedCriteria = allItems.filter(
      i => i.status === "tested" || i.result
    ).length;
    const passedCriteria = allItems.filter(i => i.result === "pass").length;
    const failedCriteria = allItems.filter(i => i.result === "fail").length;

    const overallScore = audit.totalCriteria > 0
      ? (passedCriteria / audit.totalCriteria) * 100
      : 0;

    await prisma.manualAudit.update({
      where: { id: params.id },
      data: {
        completedCriteria,
        passedCriteria,
        failedCriteria,
        overallScore: Math.round(overallScore * 10) / 10,
        compliant: failedCriteria === 0 && completedCriteria === audit.totalCriteria
      }
    });

    return NextResponse.json({ ok: true, item });
  } catch (e: any) {
    console.error("Failed to update audit item:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Failed to update audit item" },
      { status: 500 }
    );
  }
}
