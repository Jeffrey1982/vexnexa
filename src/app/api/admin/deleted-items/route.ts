import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSoftDeletedRecords } from '@/lib/soft-delete'

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const records = await getSoftDeletedRecords()

    // Flatten into a unified list for the admin UI
    const items = [
      ...records.users.map((u) => ({
        id: u.id,
        type: 'user' as const,
        name: u.email,
        email: u.email,
        deletedAt: u.deletedAt.toISOString(),
        deletedBy: u.deletedBy ?? 'system',
        metadata: {},
      })),
      ...records.sites.map((s) => ({
        id: s.id,
        type: 'site' as const,
        name: s.url,
        url: s.url,
        deletedAt: s.deletedAt.toISOString(),
        deletedBy: 'system',
        metadata: { userId: s.userId },
      })),
      ...records.scans.map((s) => ({
        id: s.id,
        type: 'scan' as const,
        name: `Scan ${s.id.slice(0, 8)}`,
        deletedAt: s.deletedAt.toISOString(),
        deletedBy: 'system',
        metadata: { siteId: s.siteId, status: s.status },
      })),
      ...records.teams.map((t) => ({
        id: t.id,
        type: 'team' as const,
        name: t.name,
        deletedAt: t.deletedAt.toISOString(),
        deletedBy: 'system',
        metadata: {},
      })),
      ...records.blogPosts.map((b) => ({
        id: b.id,
        type: 'blogPost' as const,
        name: b.title,
        deletedAt: b.deletedAt.toISOString(),
        deletedBy: 'system',
        metadata: {},
      })),
      ...records.supportTickets.map((t) => ({
        id: t.id,
        type: 'supportTicket' as const,
        name: t.subject,
        deletedAt: t.deletedAt.toISOString(),
        deletedBy: 'system',
        metadata: {},
      })),
      ...records.manualAudits.map((a) => ({
        id: a.id,
        type: 'manualAudit' as const,
        name: a.name,
        deletedAt: a.deletedAt.toISOString(),
        deletedBy: 'system',
        metadata: {},
      })),
    ]

    // Sort by deletedAt descending
    items.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime())

    return NextResponse.json({ success: true, items })
  } catch (error) {
    console.error('Fetch deleted items error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deleted items' },
      { status: 500 }
    )
  }
}
