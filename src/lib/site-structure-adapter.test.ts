import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getPortfolioStructureData, getSiteStructureData } from './site-structure-adapter'

const db = vi.hoisted(() => ({ site: { findUnique: vi.fn(), findMany: vi.fn() } }))
vi.mock('./prisma', () => ({ prisma: db }))
const site = (pages: unknown[]) => ({ id: 'site-1', url: 'https://fixture.test', pages })
const page = (id: string, pathname: string, score: number | null = 80, title: string | null = null) => ({ id, url: `https://fixture.test${pathname}`, title, scans: [{ id: `scan-${id}`, score, issues: 3, impactCritical: 1, impactSerious: 2, impactModerate: 0, impactMinor: 0, createdAt: new Date() }] })
beforeEach(() => vi.resetAllMocks())

describe('site structure from stored completed scans', () => {
  it.each([null, site([])])('returns no visualization for missing/empty site', async value => {
    db.site.findUnique.mockResolvedValue(value)
    expect(await getSiteStructureData('site-1')).toBeNull()
  })
  it('returns a minimal neutral structure for a site whose pages have never been scanned', async () => {
    db.site.findUnique.mockResolvedValue(site([{ ...page('a', '/'), scans: [] }]))
    expect(await getSiteStructureData('site-1')).toEqual({ id: 'site-1', url: 'https://fixture.test', title: 'fixture.test', level: 0, score: 0, issues: { critical: 0, serious: 0, moderate: 0, minor: 0 }, children: [] })
  })
  it('connects pages to their closest stored URL parent and aggregates issue counts', async () => {
    db.site.findUnique.mockResolvedValue(site([page('home', '/', 100), page('product', '/products', 90, 'Products'), page('detail', '/products/item', 70), page('other', '/contact', null), { ...page('never', '/unscanned'), scans: [] }]))
    const result = await getSiteStructureData('site-1')
    expect(result?.children).toHaveLength(1)
    const home = result!.children[0]
    expect(home.title).toBe('Home')
    expect(home.children.map(child => child.id)).toEqual(['product', 'other'])
    expect(home.children[0].title).toBe('Products')
    expect(home.children[0].children[0]).toMatchObject({ id: 'detail', title: 'item', level: 2, score: 70 })
    expect(home.children[1].score).toBe(0)
    expect(result?.issues).toEqual({ critical: 4, serious: 8, moderate: 0, minor: 0 })
    expect(db.site.findUnique.mock.calls[0][0].include.pages.include.scans).toMatchObject({ where: { status: 'COMPLETED' }, take: 1, orderBy: { createdAt: 'desc' } })
  })
  it('keeps orphaned paths visible when no homepage was scanned', async () => {
    db.site.findUnique.mockResolvedValue(site([page('one', '/one'), page('two', '/two'), page('deep', '/missing/deep/path')]))
    const result = await getSiteStructureData('site-1')
    expect(result?.children.map(child => child.id)).toEqual(['one', 'two', 'deep'])
  })
  it('groups absent exact parents using the most similar previous-level path', async () => {
    db.site.findUnique.mockResolvedValue(site([page('one', '/products/one'), page('two', '/help/two'), page('deep', '/products/missing/detail')]))
    const result = await getSiteStructureData('site-1')
    expect(result?.children.find(child => child.id === 'one')?.children.map(child => child.id)).toEqual(['deep'])
    expect(result?.children.find(child => child.id === 'two')?.children).toEqual([])
  })
  it('falls back to an existing previous-level parent when no path prefixes match', async () => {
    db.site.findUnique.mockResolvedValue(site([page('one', '/one'), page('deep', '/missing/deep')]))
    expect((await getSiteStructureData('site-1'))?.children[0].children[0].id).toBe('deep')
  })
  it('queries portfolios by owner, caps requested sites and excludes unscanned sites', async () => {
    db.site.findMany.mockResolvedValue([site([page('home', '/')]), { ...site([{ ...page('unscanned', '/'), scans: [] }]), id: 'site-2' }, { ...site([]), id: 'site-3' }])
    const results = await getPortfolioStructureData('owner-1')
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('root-site-1')
    expect(db.site.findMany.mock.calls[0][0]).toMatchObject({ where: { userId: 'owner-1' }, take: 20 })
  })
  it('does not hide persistence errors as empty portfolios', async () => {
    db.site.findMany.mockRejectedValue(new Error('database failed'))
    await expect(getPortfolioStructureData('owner-1')).rejects.toThrow('database failed')
  })
})
