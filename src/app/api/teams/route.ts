import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();

    const teams = await prisma.team.findMany({
      where: {
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
          select: {
            id: true,
            url: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            members: true,
            sites: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ teams });
  } catch (error) {
    console.error("Teams fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { name, description } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
      );
    }

    // Check team member limit before creating new team
    const userWithPlan = await prisma.user.findUnique({
      where: { id: user.id },
      select: { plan: true }
    });

    const ownerPlan = (userWithPlan?.plan || "TRIAL") as "TRIAL" | "STARTER" | "PRO" | "BUSINESS";
    const { ENTITLEMENTS } = await import("@/lib/billing/plans");
    const userLimit = ENTITLEMENTS[ownerPlan].users;

    // Count current team members across all teams owned by this user
    const currentMemberCount = await prisma.teamMember.count({
      where: {
        team: {
          ownerId: user.id
        }
      }
    });

    // Check if adding owner as member would exceed the limit
    if (currentMemberCount >= userLimit) {
      return NextResponse.json(
        {
          error: `Team member limit reached for ${ownerPlan} plan (${userLimit} users). Upgrade to create more teams.`,
          code: "TEAM_MEMBER_LIMIT_REACHED",
          limit: userLimit,
          current: currentMemberCount
        },
        { status: 402 }
      );
    }

    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        ownerId: user.id,
        members: {
          create: {
            userId: user.id,
            role: 'ADMIN'
          }
        }
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
    console.error("Team creation error:", error);
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    );
  }
}