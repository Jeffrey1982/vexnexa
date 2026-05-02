import { NextRequest, NextResponse } from 'next/server'
import { requireDevelopment } from '@/lib/dev-only'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isRemoteDatabaseConfigured() {
  const databaseUrl = process.env.DATABASE_URL ?? ''
  const directUrl = process.env.DIRECT_URL ?? ''
  return [databaseUrl, directUrl].some((url) =>
    /supabase\.co|pooler\.supabase\.com/i.test(url),
  )
}

export async function POST(request: NextRequest) {
  const devCheck = requireDevelopment()
  if (devCheck) return devCheck

  if (isRemoteDatabaseConfigured() && process.env.ALLOW_REMOTE_DEV_LOGIN !== 'true') {
    return NextResponse.json(
      {
        code: 'REMOTE_DB_DEV_LOGIN_DISABLED',
        error: 'Remote database detected. Refusing dev login without ALLOW_REMOTE_DEV_LOGIN=true.',
      },
      { status: 403 },
    )
  }

  const body = await request.json().catch(() => ({}))
  const email = typeof body.email === 'string' && body.email.trim()
    ? body.email.trim()
    : 'e2e@vexnexa.test'

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      firstName: 'E2E',
      lastName: 'User',
      plan: 'FREE',
      subscriptionStatus: 'active',
      profileCompleted: true,
    },
  })

  const site = await prisma.site.upsert({
    where: {
      userId_url: {
        userId: user.id,
        url: 'https://example.com/',
      },
    },
    update: {},
    create: {
      userId: user.id,
      url: 'https://example.com/',
    },
  })

  const existingScan = await prisma.scan.findFirst({
    where: { siteId: site.id },
    orderBy: { createdAt: 'desc' },
  })

  if (!existingScan) {
    await prisma.scan.create({
      data: {
        siteId: site.id,
        status: 'COMPLETED',
        score: 92,
        issues: 1,
        impactCritical: 0,
        impactSerious: 0,
        impactModerate: 1,
        impactMinor: 0,
        raw: {
          violations: [
            {
              id: 'image-alt',
              impact: 'moderate',
              help: 'Images must have alternate text',
              nodes: [{ target: ['img.logo'] }],
            },
          ],
        },
      },
    })
  }

  const response = NextResponse.json({ ok: true, userId: user.id, email })
  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: false,
    path: '/',
    maxAge: 60 * 60,
  }

  response.cookies.set('vn_dev_user_id', user.id, cookieOptions)
  response.cookies.set('vn_dev_user_email', email, cookieOptions)

  return response
}
