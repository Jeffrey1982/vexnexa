import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import * as list from './route'
import * as detail from './[id]/route'
import { POST as addSites } from './[id]/sites/route'
import { DELETE as removeSite } from './[id]/sites/[siteId]/route'

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(), portfolio: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  site: { findMany: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn(), update: vi.fn() },
}))
vi.mock('@/lib/supabase/server-new', () => ({ createClient: () => ({ auth: { getUser: mocks.getUser } }) }))
vi.mock('@/lib/prisma', () => ({ prisma: mocks }))
const req = (method = 'GET', body?: unknown) => new NextRequest('http://localhost/api/portfolios', { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
const params = () => ({ params: Promise.resolve({ id: 'p1', siteId: 's1' }) })
const ownedRoutes = [
  ['details', () => detail.GET(req(), params())], ['update', () => detail.PUT(req('PUT', { name: 'Changed' }), params())],
  ['delete', () => detail.DELETE(req('DELETE'), params())], ['add sites', () => addSites(req('POST', { siteIds: ['s1'] }), params())],
  ['remove site', () => removeSite(req('DELETE'), params())],
] as const
const allRoutes = [...ownedRoutes, ['list', () => list.GET(req())], ['create', () => list.POST(req('POST', { name: 'Portfolio' }))]] as const

beforeEach(() => {
  vi.resetAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  mocks.getUser.mockResolvedValue({ data: { user: { id: 'owner' } }, error: null })
  mocks.portfolio.findUnique.mockResolvedValue({ id: 'p1', userId: 'owner', sites: [], _count: { sites: 0 } })
  mocks.portfolio.findMany.mockResolvedValue([])
  mocks.site.findMany.mockResolvedValue([{ id: 's1', userId: 'owner' }])
  mocks.site.findUnique.mockResolvedValue({ userId: 'owner', portfolioId: 'p1' })
})

describe('portfolio isolation', () => {
  it.each(allRoutes)('requires a session for %s', async (_, run) => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null })
    expect((await run()).status).toBe(401)
    Object.values(mocks.portfolio).forEach(mock => expect(mock).not.toHaveBeenCalled())
    Object.values(mocks.site).forEach(mock => expect(mock).not.toHaveBeenCalled())
  })
  it.each(allRoutes)('rejects an errored session for %s', async (_, run) => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'owner' } }, error: new Error('expired') })
    expect((await run()).status).toBe(401)
  })
  it.each(ownedRoutes)('returns not found for missing portfolio on %s', async (_, run) => {
    mocks.portfolio.findUnique.mockResolvedValue(null)
    expect((await run()).status).toBe(404)
  })
  it.each(ownedRoutes)('prevents cross-account %s', async (_, run) => {
    mocks.portfolio.findUnique.mockResolvedValue({ id: 'p1', userId: 'other' })
    expect((await run()).status).toBe(403)
    expect(mocks.portfolio.update).not.toHaveBeenCalled()
    expect(mocks.portfolio.delete).not.toHaveBeenCalled()
    expect(mocks.site.updateMany).not.toHaveBeenCalled()
    expect(mocks.site.update).not.toHaveBeenCalled()
  })
  it.each(allRoutes)('handles authentication infrastructure failures for %s', async (_, run) => {
    mocks.getUser.mockRejectedValue(new Error('offline'))
    expect((await run()).status).toBe(500)
  })
})

describe('portfolio CRUD', () => {
  it('queries only portfolios owned by the authenticated user', async () => {
    mocks.portfolio.findMany.mockResolvedValue([{ id: 'p1' }])
    expect((await (await list.GET(req())).json()).data).toEqual([{ id: 'p1' }])
    expect(mocks.portfolio.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'owner' }, orderBy: { createdAt: 'desc' } }))
  })
  it.each([{ name: 'Agency' }, { name: 'Agency', description: 'Client sites' }])('creates owned portfolio %#', async body => {
    mocks.portfolio.create.mockResolvedValue({ id: 'p1', ...body })
    expect((await list.POST(req('POST', { ...body, userId: 'other' }))).status).toBe(201)
    expect(mocks.portfolio.create).toHaveBeenCalledWith(expect.objectContaining({ data: { userId: 'owner', name: body.name, description: body.description } }))
  })
  it.each([{}, { name: '' }, { name: 'x'.repeat(101) }, { name: 'Agency', description: 'x'.repeat(501) }])('rejects invalid new portfolio %#', async body => {
    expect((await list.POST(req('POST', body))).status).toBe(400)
    expect(mocks.portfolio.create).not.toHaveBeenCalled()
  })
  it.each([{ name: '' }, { name: 'x'.repeat(101) }, { description: 'x'.repeat(501) }])('rejects invalid portfolio edits %#', async body => {
    expect((await detail.PUT(req('PUT', body), params())).status).toBe(400)
    expect(mocks.portfolio.update).not.toHaveBeenCalled()
  })
  it.each([{}, { name: 'Changed' }, { description: 'New description' }])('updates only permitted fields %#', async body => {
    mocks.portfolio.update.mockResolvedValue({ id: 'p1' })
    expect((await detail.PUT(req('PUT', { ...body, userId: 'other' }), params())).status).toBe(200)
    expect(mocks.portfolio.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'p1' }, data: body }))
  })
  it('returns the owned portfolio with latest scan selection', async () => {
    expect((await (await detail.GET(req(), params())).json()).data.id).toBe('p1')
    expect(mocks.portfolio.findUnique.mock.calls[0][0].include.sites.include.scans).toEqual(expect.objectContaining({ take: 1, orderBy: { createdAt: 'desc' } }))
  })
  it('deletes an owned portfolio', async () => {
    expect((await detail.DELETE(req('DELETE'), params())).status).toBe(200)
    expect(mocks.portfolio.delete).toHaveBeenCalledWith({ where: { id: 'p1' } })
  })
  it.each([
    ['list', () => list.GET(req()), () => mocks.portfolio.findMany], ['create', () => list.POST(req('POST', { name: 'Agency' })), () => mocks.portfolio.create],
    ['details', () => detail.GET(req(), params()), () => mocks.portfolio.findUnique], ['update', () => detail.PUT(req('PUT', {}), params()), () => mocks.portfolio.update],
    ['delete', () => detail.DELETE(req('DELETE'), params()), () => mocks.portfolio.delete], ['add', () => addSites(req('POST', { siteIds: ['s1'] }), params()), () => mocks.site.updateMany],
    ['remove', () => removeSite(req('DELETE'), params()), () => mocks.site.update],
  ] as const)('does not mask storage errors in %s', async (_, run, target) => {
    target().mockRejectedValue(new Error('database failure'))
    expect((await run()).status).toBe(500)
  })
})

describe('portfolio membership and metrics', () => {
  it.each([{}, { siteIds: [] }, { siteIds: [123] }])('validates site selection %#', async body => {
    expect((await addSites(req('POST', body), params())).status).toBe(400)
    expect(mocks.site.updateMany).not.toHaveBeenCalled()
  })
  it('requires every selected site to belong to the user', async () => {
    mocks.site.findMany.mockResolvedValue([])
    expect((await addSites(req('POST', { siteIds: ['s1'] }), params())).status).toBe(400)
    expect(mocks.site.findMany).toHaveBeenCalledWith({ where: { id: { in: ['s1'] }, userId: 'owner' } })
    expect(mocks.site.updateMany).not.toHaveBeenCalled()
  })
  it.each([[null, 404], [{ userId: 'other', portfolioId: 'p1' }, 403], [{ userId: 'owner', portfolioId: 'p2' }, 400]] as const)('checks removed site existence, ownership and membership %#', async (site, status) => {
    mocks.site.findUnique.mockResolvedValue(site)
    expect((await removeSite(req('DELETE'), params())).status).toBe(status)
    expect(mocks.site.update).not.toHaveBeenCalled()
  })
  it.each([
    [null, { totalSites: 0, avgScore: null, totalIssues: 0 }],
    [{ sites: [], _count: { sites: 0 } }, { totalSites: 0, avgScore: null, totalIssues: 0 }],
    [{ sites: [{ scans: [] }, { scans: [{ score: 80, issues: 2 }] }, { scans: [{ score: null, issues: null }] }], _count: { sites: 3 } }, { totalSites: 3, avgScore: 40, totalIssues: 2 }],
  ])('recalculates metrics after add and remove %#', async (portfolio, metrics) => {
    for (const [run, action] of [[() => addSites(req('POST', { siteIds: ['s1'] }), params()), 'add'], [() => removeSite(req('DELETE'), params()), 'remove']] as const) {
      mocks.portfolio.findUnique.mockResolvedValueOnce({ userId: 'owner' }).mockResolvedValueOnce(portfolio)
      expect((await run()).status).toBe(200)
      expect(mocks.portfolio.update).toHaveBeenLastCalledWith({ where: { id: 'p1' }, data: metrics })
      if (action === 'add') expect(mocks.site.updateMany).toHaveBeenCalledWith({ where: { id: { in: ['s1'] } }, data: { portfolioId: 'p1' } })
      else expect(mocks.site.update).toHaveBeenCalledWith({ where: { id: 's1' }, data: { portfolioId: null } })
    }
  })
})
