import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const user = await requireAuth();
    const { teamId } = params;

    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        OR: [
          { ownerId: user.id },
          {
            members: {
              some: {
                userId: user.id
              }
            }
          }
        ]
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        sites: {
          include: {
            scans: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                score: true,
                issues: true,
                status: true,
                createdAt: true
              }
            }
          }
        },
        invites: {
          where: {
            acceptedAt: null,
            expiresAt: {
              gt: new Date()
            }
          }
        }
      }
    });

    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ team });
  } catch (error) {
    console.error("Team fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch team" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const user = await requireAuth();
    const { teamId } = params;
    const { name, description } = await req.json();

    // Check if user is team owner or admin
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: user.id,
        OR: [
          { team: { ownerId: user.id } },
          { role: 'ADMIN' }
        ]
      }
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const team = await prisma.team.update({
      where: { id: teamId },
      data: {
        name: name?.trim(),
        description: description?.trim()
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        _count: {
          select: {
            members: true,
            sites: true
          }
        }
      }
    });

    return NextResponse.json({ team });
  } catch (error) {
    console.error("Team update error:", error);
    return NextResponse.json(
      { error: "Failed to update team" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const user = await requireAuth();
    const { teamId } = params;

    // Only team owner can delete the team
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        ownerId: user.id
      }
    });

    if (!team) {
      return NextResponse.json(
        { error: "Team not found or insufficient permissions" },
        { status: 404 }
      );
    }

    await prisma.team.delete({
      where: { id: teamId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Team deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 }
    );
  }
}