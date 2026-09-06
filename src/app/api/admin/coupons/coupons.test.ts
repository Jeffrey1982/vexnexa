import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import * as collection from './route'
import * as detail from './[id]/route'

const mocks = vi.hoisted(() => ({ admin: vi.fn(), coupon: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() } }))
vi.mock('@/lib/auth', () => ({ requireAdminAPI: mocks.admin }))
vi.mock('@/lib/prisma', () => ({ prisma: { coupon: mocks.coupon } }))
const req = (method = 'GET', body?: unknown, query = '') => new NextRequest(`http://localhost/api/admin/coupons${query}`, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
const params = () => ({ params: Promise.resolve({ id: 'c1' }) })
const routes = [
  ['list', () => collection.GET(req())], ['create', () => collection.POST(req('POST', { code: 'DEMO', grantType: 'FREE_SCANS', grantValue: '5' }))],
  ['detail', () => detail.GET(req(), params())], ['update', () => detail.PATCH(req('PATCH', {}), params())], ['delete', () => detail.DELETE(req('DELETE'), params())],
] as const

beforeEach(() => {
  vi.resetAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  mocks.admin.mockResolvedValue({ id: 'admin' })
  mocks.coupon.findUnique.mockResolvedValue(null)
  mocks.coupon.findMany.mockResolvedValue([])
})

describe('coupon endpoint access and failure handling', () => {
  it.each(routes)('does not access coupon data when authorization fails on %s', async (_, run) => {
    mocks.admin.mockRejectedValue(new Error('Unauthorized'))
    const response = await run()
    expect(response.ok).toBe(false)
    expect((await response.json()).success).toBe(false)
    Object.values(mocks.coupon).forEach(mock => expect(mock).not.toHaveBeenCalled())
  })
  it.each(routes)('handles non-Error failure values on %s', async (_, run) => {
    mocks.admin.mockRejectedValue('unavailable')
    expect(await (await run()).json()).toEqual({ success: false, error: 'Internal server error' })
  })
  it.each([
    ['list', () => collection.GET(req()), () => mocks.coupon.findMany],
    ['create', () => collection.POST(req('POST', { grantType: 'FREE_SCANS', grantValue: '5' })), () => mocks.coupon.create],
    ['detail', () => detail.GET(req(), params()), () => mocks.coupon.findUnique],
    ['update', () => detail.PATCH(req('PATCH', {}), params()), () => mocks.coupon.update],
    ['delete', () => detail.DELETE(req('DELETE'), params()), () => mocks.coupon.delete],
  ] as const)('reports database errors for %s', async (_, run, target) => {
    target().mockRejectedValue(new Error('database unavailable'))
    expect((await run()).status).toBe(500)
  })
})

describe('coupon listing and creation', () => {
  it('uses an unfiltered recent-first query by default', async () => {
    const response = await collection.GET(req())
    expect(await response.json()).toEqual({ success: true, coupons: [] })
    expect(mocks.coupon.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: undefined, orderBy: { createdAt: 'desc' } }))
  })
  it.each(['active', 'expired', 'all'])('preserves search when combined with %s status', async status => {
    await collection.GET(req('GET', undefined, `?search=agency&status=${status}`))
    const where = mocks.coupon.findMany.mock.calls[0][0].where
    expect(where.OR).toEqual([{ code: { contains: 'agency', mode: 'insensitive' } }, { name: { contains: 'agency', mode: 'insensitive' } }])
    if (status === 'active') {
      expect(where.isActive).toBe(true)
      expect(where.AND).toEqual([{ OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }] }])
    } else if (status === 'expired') {
      expect(where.AND).toEqual([{ OR: [{ isActive: false }, { expiresAt: { lte: expect.any(Date) } }] }])
    } else expect(where.AND).toBeUndefined()
  })
  it.each([{}, { grantType: 'UNKNOWN', grantValue: '5' }, { grantType: 'FREE_SCANS' }, { code: '--a', grantType: 'FREE_SCANS', grantValue: '5' }])('rejects invalid grants before persistence %#', async body => {
    expect((await collection.POST(req('POST', body))).status).toBe(400)
    expect(mocks.coupon.create).not.toHaveBeenCalled()
  })
  it('normalizes codes before checking uniqueness', async () => {
    mocks.coupon.findUnique.mockResolvedValue({ id: 'existing' })
    const response = await collection.POST(req('POST', { code: 'agency-2026!', grantType: 'FREE_SCANS', grantValue: '5' }))
    expect(response.status).toBe(409)
    expect(mocks.coupon.findUnique).toHaveBeenCalledWith({ where: { code: 'AGENCY2026' } })
    expect(mocks.coupon.create).not.toHaveBeenCalled()
  })
  it.each(['PLAN_TRIAL', 'PLAN_STARTER', 'PLAN_PRO', 'PLAN_BUSINESS', 'FREE_SCANS'])('creates supported %s grant with safe defaults', async grantType => {
    mocks.coupon.create.mockResolvedValue({ id: 'c1' })
    const response = await collection.POST(req('POST', { code: 'demo!', grantType, grantValue: 5 }))
    expect(response.status).toBe(201)
    expect(mocks.coupon.create).toHaveBeenCalledWith({ data: { code: 'DEMO', name: null, description: null, grantType, grantValue: '5', maxRedemptions: null, perUserLimit: 1, startsAt: null, expiresAt: null, isActive: true, createdBy: 'admin' } })
  })
  it('retains explicit limits and scheduled validity', async () => {
    await collection.POST(req('POST', { code: 'scheduled', grantType: 'FREE_SCANS', grantValue: '10', name: 'Agency', description: 'Test coupon', maxRedemptions: 20, perUserLimit: 2, startsAt: '2026-09-07', expiresAt: '2026-10-01', isActive: false }))
    expect(mocks.coupon.create.mock.calls[0][0].data).toMatchObject({ name: 'Agency', description: 'Test coupon', maxRedemptions: 20, perUserLimit: 2, startsAt: new Date('2026-09-07'), expiresAt: new Date('2026-10-01'), isActive: false })
  })
  it.each([{ generateCodeFlag: true, code: 'IGNORED' }, {}])('generates an alphanumeric code when requested %#', async extra => {
    await collection.POST(req('POST', { ...extra, grantType: 'FREE_SCANS', grantValue: '3' }))
    expect(mocks.coupon.create.mock.calls[0][0].data.code).toMatch(/^[A-Z0-9]{3,8}$/)
  })
})

describe('coupon detail management', () => {
  it('returns a missing coupon as 404', async () => {
    expect((await detail.GET(req(), params())).status).toBe(404)
  })
  it('includes bounded recent redemptions for an existing coupon', async () => {
    mocks.coupon.findUnique.mockResolvedValue({ id: 'c1', redemptions: [] })
    expect((await (await detail.GET(req(), params())).json()).coupon.id).toBe('c1')
    expect(mocks.coupon.findUnique.mock.calls[0][0]).toMatchObject({ where: { id: 'c1' }, include: { redemptions: { take: 50, orderBy: { redeemedAt: 'desc' } } } })
  })
  it.each([
    [{}, {}], [{ isActive: false }, { isActive: false }], [{ isActive: 'yes' }, {}],
    [{ name: '', description: '', expiresAt: null }, { name: null, description: null, expiresAt: null }],
    [{ name: 'New', description: 'Updated', expiresAt: '2026-10-01', maxRedemptions: null, perUserLimit: 3 }, { name: 'New', description: 'Updated', expiresAt: new Date('2026-10-01'), maxRedemptions: null, perUserLimit: 3 }],
  ])('updates only the supplied supported fields %#', async (body, expected) => {
    mocks.coupon.update.mockResolvedValue({ id: 'c1' })
    expect((await detail.PATCH(req('PATCH', body), params())).status).toBe(200)
    expect(mocks.coupon.update).toHaveBeenCalledWith({ where: { id: 'c1' }, data: expected })
  })
  it('deletes by resolved route id', async () => {
    expect(await (await detail.DELETE(req('DELETE'), params())).json()).toEqual({ success: true })
    expect(mocks.coupon.delete).toHaveBeenCalledWith({ where: { id: 'c1' } })
  })
})
