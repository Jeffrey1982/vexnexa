import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
const db = vi.hoisted(() => ({ user: { findUnique: vi.fn() }, site: { count: vi.fn() }, usage: { findUnique: vi.fn(), create: vi.fn(), upsert: vi.fn() } }))
vi.mock('../prisma', () => ({ prisma: db }))
import { getEntitlements, getTotalEntitlements, assertCanCreateSite, assertWithinLimits, hasWeeklyFreeScanAvailable, consumeWeeklyFreeScan, addPageUsage, addSiteUsage, getCurrentUsage } from './entitlements'

const user = (overrides = {}) => ({ id: 'u1', plan: 'PRO', subscriptionStatus: 'active', addOns: [], hasAssurance: false, ...overrides })
beforeEach(() => { vi.resetAllMocks(); db.user.findUnique.mockResolvedValue(user()); db.usage.findUnique.mockResolvedValue({ pages: 0, sites: 0 }); db.site.count.mockResolvedValue(0) })
afterEach(() => vi.useRealTimers())

describe('entitlement aggregation', () => {
  it('preserves plan features while adding only active capacity', async () => {
    db.user.findUnique.mockResolvedValue(user({ addOns: [
      { type: 'EXTRA_SEAT', quantity: 2, status: 'active' }, { type: 'EXTRA_WEBSITE_5', quantity: 1, status: 'active' },
      { type: 'PAGE_PACK_25K', quantity: 1, status: 'active' }, { type: 'EXTRA_SEAT', quantity: 100, status: 'canceled' },
      { type: 'EXTRA_SEAT', quantity: 100, status: 'pending' }, { type: 'EXTRA_WEBSITE_10', quantity: 1, status: 'pending' }, { type: 'PAGE_PACK_100K', quantity: 1, status: 'pending' },
    ] }))
    expect(await getTotalEntitlements('u1')).toMatchObject({ sites: 8, users: 7, pagesPerMonth: 30000, word: true, base: { sites: 3, users: 5, pagesPerMonth: 5000 }, addOns: { sites: 5, users: 2, pagesPerMonth: 25000 } })
    expect(db.user.findUnique).toHaveBeenCalledWith({ where: { id: 'u1' }, include: { addOns: { where: { status: 'active' } } } })
  })
  it.each([{ hasAssurance: true }, { addOns: [{ type: 'ASSURANCE', quantity: 1, status: 'active' }] }, { plan: 'BUSINESS' }])('recognizes assurance access %j', async overrides => {
    db.user.findUnique.mockResolvedValue(user({ plan: 'FREE', ...overrides }))
    expect((await getTotalEntitlements('u1')).hasAssurance).toBe(true)
  })
  it('does not give free users assurance by default', async () => {
    db.user.findUnique.mockResolvedValue(user({ plan: 'FREE' }))
    expect((await getTotalEntitlements('u1')).hasAssurance).toBe(false)
    expect(getEntitlements('FREE')).toMatchObject({ sites: 1, word: false })
  })
  it('rejects missing users', async () => { db.user.findUnique.mockResolvedValue(null); await expect(getTotalEntitlements('missing')).rejects.toThrow('User not found') })
  it('permits a site below capacity and blocks the exact boundary', async () => {
    db.site.count.mockResolvedValueOnce(2).mockResolvedValueOnce(3)
    await expect(assertCanCreateSite('u1')).resolves.toBeUndefined()
    await expect(assertCanCreateSite('u1')).rejects.toMatchObject({ code: 'SITE_LIMIT_REACHED', limit: 3, current: 3 })
    expect(db.site.count).toHaveBeenCalledWith({ where: { userId: 'u1' } })
  })
})

describe('billing and feature gates', () => {
  it('retains paid features until the exact cancellation period end', async () => {
    db.user.findUnique.mockResolvedValue(user({ subscriptionCanceledAt: new Date('2026-09-01Z'), subscriptionCurrentPeriodEnd: new Date('2026-10-01Z') }))
    await expect(assertWithinLimits({ userId: 'u1', action: 'export_word', now: new Date('2026-09-30T23:59:59Z') })).resolves.toBeUndefined()
    await expect(assertWithinLimits({ userId: 'u1', action: 'export_word', now: new Date('2026-10-01Z') })).rejects.toMatchObject({ code: 'SUBSCRIPTION_INACTIVE' })
  })
  it('stops advertising paid base entitlements after the canceled paid period expires', async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-01Z'))
    db.user.findUnique.mockResolvedValue(user({ subscriptionCanceledAt: new Date('2026-09-01Z'), subscriptionCurrentPeriodEnd: new Date('2026-10-01Z') }))
    expect(await getTotalEntitlements('u1')).toMatchObject({ base: { sites: 1 }, word: false })
  })
  it.each(['past_due', 'canceled', 'failed', 'pending'])('blocks paid %s accounts before usage writes', async subscriptionStatus => {
    db.user.findUnique.mockResolvedValue(user({ subscriptionStatus }))
    await expect(assertWithinLimits({ userId: 'u1', action: 'scan' })).rejects.toMatchObject({ code: 'SUBSCRIPTION_INACTIVE', subscriptionStatus, gracePeriodDays: 0 })
    expect(db.usage.create).not.toHaveBeenCalled()
  })
  it.each([['export_word', 'word'], ['schedule', 'schedule'], ['crawl', 'crawl'], ['bulk_scan', 'bulk_scan'], ['white_label', 'whiteLabel']] as const)('blocks unavailable %s for free users', async (action, feature) => {
    db.user.findUnique.mockResolvedValue(user({ plan: 'FREE', subscriptionStatus: 'inactive' }))
    await expect(assertWithinLimits({ userId: 'u1', action })).rejects.toMatchObject({ code: 'UPGRADE_REQUIRED', feature })
  })
  it('rejects absent users without counting usage', async () => { db.user.findUnique.mockResolvedValue(null); await expect(assertWithinLimits({ userId: 'u1', action: 'scan' })).rejects.toThrow('User not found'); expect(db.usage.findUnique).not.toHaveBeenCalled() })
  it.each([['FREE', 100, 'FREE_LIMIT_REACHED', true], ['PRO', 5000, 'LIMIT_REACHED', false]] as const)('enforces monthly %s capacity', async (plan, pages, code, requiresUpgrade) => {
    db.user.findUnique.mockResolvedValue(user({ plan })); db.usage.findUnique.mockResolvedValue({ pages })
    await expect(assertWithinLimits({ userId: 'u1', action: 'scan', now: new Date('2026-01-01T00:00:00Z') })).rejects.toMatchObject({ code, limit: pages, current: pages, requiresUpgrade })
    expect(db.usage.findUnique).toHaveBeenCalledWith({ where: { userId_period: { userId: 'u1', period: '2026-01' } } })
  })
  it('creates initial usage without blocking the first scan', async () => {
    db.usage.findUnique.mockResolvedValue(null); db.usage.create.mockResolvedValue({ pages: 0 })
    await expect(assertWithinLimits({ userId: 'u1', action: 'scan', now: new Date('2026-09-06Z') })).resolves.toBeUndefined()
    expect(db.usage.create).toHaveBeenCalledWith({ data: { userId: 'u1', period: '2026-09' } })
  })
  it('counts purchased pages toward limits and does not consume pages for scheduling', async () => {
    db.user.findUnique.mockResolvedValue(user({ addOns: [{ type: 'SCAN_PACK_100', quantity: 1, status: 'active' }] })); db.usage.findUnique.mockResolvedValue({ pages: 5000 })
    await expect(assertWithinLimits({ userId: 'u1', action: 'scan' })).resolves.toBeUndefined()
    db.usage.findUnique.mockClear(); await assertWithinLimits({ userId: 'u1', action: 'schedule' }); expect(db.usage.findUnique).not.toHaveBeenCalled()
  })
})

describe('usage periods', () => {
  it('uses ISO week-year across the New Year boundary', async () => {
    db.usage.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ pages: 1 })
    expect(await hasWeeklyFreeScanAvailable('u1', new Date('2021-01-01Z'))).toBe(true)
    expect(await hasWeeklyFreeScanAvailable('u1', new Date('2021-01-01Z'))).toBe(false)
    await consumeWeeklyFreeScan('u1', new Date('2021-01-01Z'))
    expect(db.usage.upsert).toHaveBeenCalledWith({ where: { userId_period: { userId: 'u1', period: 'WEEK-2020-53' } }, update: { pages: { increment: 1 } }, create: { userId: 'u1', period: 'WEEK-2020-53', pages: 1, sites: 0 } })
  })
  it('records monthly increments atomically and returns zero when absent', async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-06T12:00:00Z')); db.usage.findUnique.mockResolvedValue(null)
    await addPageUsage('u1', 12); await addSiteUsage('u1'); await consumeWeeklyFreeScan('u1'); await hasWeeklyFreeScanAvailable('u1')
    expect(db.usage.upsert).toHaveBeenNthCalledWith(1, { where: { userId_period: { userId: 'u1', period: '2026-09' } }, update: { pages: { increment: 12 } }, create: { userId: 'u1', period: '2026-09', pages: 12 } })
    expect(db.usage.upsert).toHaveBeenNthCalledWith(2, { where: { userId_period: { userId: 'u1', period: '2026-09' } }, update: { sites: { increment: 1 } }, create: { userId: 'u1', period: '2026-09', sites: 1, pages: 0 } })
    expect(await getCurrentUsage('u1')).toEqual({ period: '2026-09', pages: 0, sites: 0 })
    db.usage.findUnique.mockResolvedValue({ pages: 12, sites: 3 }); expect(await getCurrentUsage('u1')).toEqual({ period: '2026-09', pages: 12, sites: 3 })
  })
})
