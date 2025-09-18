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