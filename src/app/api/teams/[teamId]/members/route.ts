import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const user = await requireAuth();
    const { teamId } = params;
    const { email, role = 'VIEWER' } = await req.json();

    if (!email?.trim()) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if user can invite (must be admin or owner)
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
        { error: "Insufficient permissions to invite members" },
        { status: 403 }
      );
    }

    // Check if user is already a member
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        user: {
          email: email.toLowerCase().trim()
        }
      }
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a team member" },
        { status: 400 }
      );
    }

    // Check if there's already a pending invite
    const existingInvite = await prisma.teamInvite.findFirst({
      where: {
        teamId,
        email: email.toLowerCase().trim(),
        acceptedAt: null,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: "Invitation already sent to this email" },
        { status: 400 }
      );
    }

    // Check if the invited user exists
    const invitedUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (invitedUser) {
      // User exists, add them directly to the team
      const newMember = await prisma.teamMember.create({
        data: {
          teamId,
          userId: invitedUser.id,
          role: role as any,
          invitedBy: user.id
        },
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
      });

      return NextResponse.json({ member: newMember });
    } else {
      // User doesn't exist, create invitation
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const invite = await prisma.teamInvite.create({
        data: {
          teamId,
          email: email.toLowerCase().trim(),
          role: role as any,
          invitedBy: user.id,
          token,
          expiresAt
        },
        include: {
          team: {
            select: {
              name: true
            }
          },
          inviter: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      // TODO: Send invitation email

      return NextResponse.json({ invite });
    }
  } catch (error) {
    console.error("Team member invitation error:", error);
    return NextResponse.json(
      { error: "Failed to invite team member" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const user = await requireAuth();
    const { teamId } = params;

    // Check if user has access to this team
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: user.id
      }
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const members = await prisma.teamMember.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        inviter: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        joinedAt: 'asc'
      }
    });

    const invites = await prisma.teamInvite.findMany({
      where: {
        teamId,
        acceptedAt: null,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        inviter: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return NextResponse.json({ members, invites });
  } catch (error) {
    console.error("Team members fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch team members" },
      { status: 500 }
    );
  }
}