import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { getUser, findFirst } = vi.hoisted(() => ({
  getUser: vi.fn(),
  findFirst: vi.fn(),
}))

vi.mock('@/lib/supabase/server-new', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser },
  })),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    site: {
      findFirst,
    },
  },
}))

import { GET } from './route'

describe('GET /api/sites/[siteId]', () => {
  beforeEach(() => {
    getUser.mockReset()
    findFirst.mockReset()
  })

  it('rejects unauthenticated requests before querying site data', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null })

    const response = await GET(
      new NextRequest('https://vexnexa.test/api/sites/site-1'),
      { params: Promise.resolve({ siteId: 'site-1' }) }
    )

    expect(response.status).toBe(401)
    expect(findFirst).not.toHaveBeenCalled()
  })

  it('scopes the lookup to the authenticated owner', async () => {
    getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    findFirst.mockResolvedValue(null)

    const response = await GET(
      new NextRequest('https://vexnexa.test/api/sites/site-1'),
      { params: Promise.resolve({ siteId: 'site-1' }) }
    )

    expect(response.status).toBe(404)
    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        id: 'site-1',
        userId: 'user-1',
      },
    }))
  })
})
