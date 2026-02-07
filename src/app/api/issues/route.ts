import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const scanId = searchParams.get('scanId');
    const status = searchParams.get('status');
    const assignedToMe = searchParams.get('assignedToMe') === 'true';

    let whereClause: any = {
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
    };

    if (scanId) {
      whereClause.scanId = scanId;
    }

    if (status) {
      whereClause.status = status;
    }

    if (assignedToMe) {
      whereClause.assignedToId = user.id;
    }

    const issues = await prisma.issue.findMany({
      where: whereClause,
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
        _count: {
          select: {
            comments: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({ issues });
  } catch (error: any) {
    if (error?.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Issues fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch issues" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { scanId, violationId, title, description, priority = 'MEDIUM', assignedToId, dueDate } = await req.json();

    if (!scanId || !violationId || !title) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user has access to this scan
    const scan = await prisma.scan.findFirst({
      where: {
        id: scanId,
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
    });

    if (!scan) {
      return NextResponse.json(
        { error: "Scan not found or access denied" },
        { status: 404 }
      );
    }

    const issue = await prisma.issue.create({
      data: {
        scanId,
        violationId,
        title: title.trim(),
        description: description?.trim(),
        priority: priority as any,
        assignedToId,
        createdById: user.id,
        dueDate: dueDate ? new Date(dueDate) : null
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
        }
      }
    });

    // Create activity log
    await prisma.issueActivity.create({
      data: {
        issueId: issue.id,
        userId: user.id,
        action: 'created',
        newValue: `Issue created with priority ${priority}`
      }
    });

    return NextResponse.json({ issue });
  } catch (error) {
    console.error("Issue creation error:", error);
    return NextResponse.json(
      { error: "Failed to create issue" },
      { status: 500 }
    );
  }
}