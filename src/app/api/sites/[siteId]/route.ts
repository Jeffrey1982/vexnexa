import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const site = await prisma.site.findUnique({
      where: { id: params.siteId },
      include: {
        pages: {
          include: {
            scans: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        scans: {
          orderBy: { createdAt: 'desc' },
          take: 30  // More scans for analytics
        },
        crawls: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    return NextResponse.json(site);
  } catch (error) {
    console.error('Error fetching site:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
