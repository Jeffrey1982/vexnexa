import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { requireAdminAPI, executeRaw } = vi.hoisted(() => ({
  requireAdminAPI: vi.fn(),
  executeRaw: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ requireAdminAPI }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $executeRaw: executeRaw,
  },
}))

import { PATCH } from './route'

describe('PATCH /api/admin/public-reports', () => {
  beforeEach(() => {
    requireAdminAPI.mockReset()
    executeRaw.mockReset()
    requireAdminAPI.mockResolvedValue({ id: 'admin-1' })
  })

  it('blocks re-enabling a report without recorded publication consent', async () => {
    const response = await PATCH(new NextRequest(
      'https://vexnexa.test/api/admin/public-reports',
      {
        method: 'PATCH',
        body: JSON.stringify({ siteId: 'site-1', publicPageEnabled: true }),
        headers: { 'content-type': 'application/json' },
      }
    ))

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toMatchObject({
      code: 'PUBLIC_REPORT_PUBLICATION_CONSENT_REQUIRED',
    })
    expect(executeRaw).not.toHaveBeenCalled()
  })

  it('continues to allow an administrator to disable a public page', async () => {
    executeRaw.mockResolvedValue(1)

    const response = await PATCH(new NextRequest(
      'https://vexnexa.test/api/admin/public-reports',
      {
        method: 'PATCH',
        body: JSON.stringify({ siteId: 'site-1', publicPageEnabled: false }),
        headers: { 'content-type': 'application/json' },
      }
    ))

    expect(response.status).toBe(200)
    expect(executeRaw).toHaveBeenCalledOnce()
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      siteId: 'site-1',
      publicPageEnabled: false,
    })
  })
})
