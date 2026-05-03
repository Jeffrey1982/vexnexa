import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  const { issueId } = await params

  try {
    const user = await requireAuth();
    const issue = await prisma.issue.findFirst({
      where: {
        id: issueId,
        scan: {
          site: {
            OR: [
              { userId: user.id },
              {
                teams: {
                  some: {
                    members: {
                      some: {
                        userId: user.id
                      }
                    }
                  }
                }
              }
            ]
          }
        }
      },
      include: {
        scan: {
          include: {
            site: {
              select: {
                url: true
              }
            }
          }
        },
        assignedTo: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        resolvedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        activities: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (!issue) {
      return NextResponse.json(
        { error: "Issue not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ issue });
  } catch (error) {
    console.error("Issue fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch issue" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  const { issueId } = await params

  try {
    const user = await requireAuth();
    const updates = await req.json();

    // Check if user has access to this issue
    const existingIssue = await prisma.issue.findFirst({
      where: {
        id: issueId,
        scan: {
          site: {
            OR: [
              { userId: user.id },
              {
                teams: {
                  some: {
                    members: {
                      some: {
                        userId: user.id,
                        role: { in: ['ADMIN', 'EDITOR'] }
                      }
                    }
                  }
                }
              }
            ]
          }
        }
      }
    });

    if (!existingIssue) {
      return NextResponse.json(
        { error: "Issue not found or access denied" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    const activities: Array<{ action: string; oldValue?: string; newValue?: string }> = [];

    if ('title' in updates && updates.title && updates.title !== existingIssue.title) {
      updateData.title = updates.title.trim();
      activities.push({
        action: 'title_changed',
        oldValue: existingIssue.title,
        newValue: updates.title.trim()
      });
    }

    if ('description' in updates && updates.description !== existingIssue.description) {
      updateData.description = updates.description?.trim();
      activities.push({
        action: 'description_changed',
        oldValue: existingIssue.description || 'None',
        newValue: updates.description?.trim() || 'None'
      });
    }

    if (updates.status && updates.status !== existingIssue.status) {
      updateData.status = updates.status;

      if (['RESOLVED', 'ACCEPTED_RISK', 'FALSE_POSITIVE', 'CLOSED'].includes(updates.status)) {
        updateData.resolvedAt = new Date();
        updateData.resolvedById = user.id;
      } else if (['RESOLVED', 'ACCEPTED_RISK', 'FALSE_POSITIVE', 'CLOSED'].includes(existingIssue.status)) {
        updateData.resolvedAt = null;
        updateData.resolvedById = null;
      }

      activities.push({
        action: 'status_changed',
        oldValue: existingIssue.status,
        newValue: updates.status
      });
    }

    if (updates.priority && updates.priority !== existingIssue.priority) {
      updateData.priority = updates.priority;
      activities.push({
        action: 'priority_changed',
        oldValue: existingIssue.priority,
        newValue: updates.priority
      });
    }

    if ('assignedToId' in updates && updates.assignedToId !== existingIssue.assignedToId) {
      updateData.assignedToId = updates.assignedToId;
      updateData.assignedById = user.id;
      activities.push({
        action: 'assigned',
        oldValue: existingIssue.assignedToId || 'Unassigned',
        newValue: updates.assignedToId || 'Unassigned'
      });
    }

    if ('dueDate' in updates) {
      const nextDueDate = updates.dueDate ? new Date(updates.dueDate) : null;
      const currentDueDateValue = existingIssue.dueDate?.toISOString() || null;
      const nextDueDateValue = nextDueDate?.toISOString() || null;

      if (nextDueDateValue === currentDueDateValue) {
        // No-op, but keep other requested updates in the same request.
      } else {
        updateData.dueDate = nextDueDate;
        activities.push({
          action: 'due_date_changed',
          oldValue: existingIssue.dueDate?.toISOString() || 'None',
          newValue: updates.dueDate || 'None'
        });
      }
    }

    const evidenceFields = [
      'impact',
      'wcagCriteria',
      'helpUrl',
      'pageUrl',
      'selector',
      'htmlSnippet',
      'failureSummary',
      'screenshotDataUrl',
      'acceptedRiskReason',
      'falsePositiveReason',
    ] as const;

    for (const field of evidenceFields) {
      if (field in updates && updates[field] !== (existingIssue as any)[field]) {
        updateData[field] = updates[field];
        activities.push({
          action: `${field}_changed`,
          oldValue: Array.isArray((existingIssue as any)[field])
            ? (existingIssue as any)[field].join(', ')
            : ((existingIssue as any)[field] || 'None'),
          newValue: Array.isArray(updates[field])
            ? updates[field].join(', ')
            : (updates[field] || 'None'),
        });
      }
    }

    // Update the issue
    const issue = await prisma.issue.update({
      where: { id: issueId },
      data: updateData,
      include: {
        scan: {
          include: {
            site: {
              select: {
                url: true
              }
            }
          }
        },
        assignedTo: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        resolvedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Create activity logs
    for (const activity of activities) {
      await prisma.issueActivity.create({
        data: {
          issueId: issue.id,
          userId: user.id,
          action: activity.action,
          oldValue: activity.oldValue,
          newValue: activity.newValue
        }
      });
    }

    return NextResponse.json({ issue });
  } catch (error) {
    console.error("Issue update error:", error);
    return NextResponse.json(
      { error: "Failed to update issue" },
      { status: 500 }
    );
  }
}
