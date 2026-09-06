import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import * as collection from './route'
import * as detail from './[id]/route'
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), user: { findUnique: vi.fn() }, site: { findUnique: vi.fn() }, scheduledScan: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() } }))
vi.mock('@/lib/supabase/server-new', () => ({ createClient: () => ({ auth: { getUser: mocks.getUser } }) }))
vi.mock('@/lib/prisma', () => ({ prisma: mocks }))
const req = (method = 'GET', body?: unknown) => new NextRequest('http://localhost/api/scheduled-scans', { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
const params = () => ({ params: Promise.resolve({ id: 'schedule1' }) })
const existing = { id: 'schedule1', userId: 'db-owner', frequency: 'weekly', dayOfWeek: 1, dayOfMonth: null, timeOfDay: '09:00' }
const routes = [['list', () => collection.GET(req())], ['create', () => collection.POST(req('POST', { siteId: 's1', frequency: 'daily' }))], ['detail', () => detail.GET(req(), params())], ['update', () => detail.PATCH(req('PATCH', {}), params())], ['delete', () => detail.DELETE(req('DELETE'), params())]] as const
beforeEach(() => {
  vi.resetAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 8, 6, 12, 0)) // Sunday, using the server's local scheduling convention.
  vi.spyOn(console, 'error').mockImplementation(() => {})
  mocks.getUser.mockResolvedValue({ data: { user: { id: 'auth-owner', email: 'test@example.com' } }, error: null })
  mocks.user.findUnique.mockResolvedValue({ id: 'db-owner' })
  mocks.site.findUnique.mockResolvedValue({ id: 's1', userId: 'db-owner' })
  mocks.scheduledScan.findUnique.mockResolvedValue(existing)
  mocks.scheduledScan.findMany.mockResolvedValue([])
  mocks.scheduledScan.create.mockResolvedValue(existing)
  mocks.scheduledScan.update.mockResolvedValue(existing)
})
afterEach(() => vi.useRealTimers())

describe('scheduled scan authorization', () => {
  it.each(routes)('rejects anonymous %s', async (_, run) => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null })
    expect((await run()).status).toBe(401)
    expect(mocks.user.findUnique).not.toHaveBeenCalled()
  })
  it.each(routes)('rejects expired-session %s', async (_, run) => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'auth-owner' } }, error: new Error('expired') })
    expect((await run()).status).toBe(401)
  })
  it.each(routes)('requires a synchronized application account for %s', async (_, run) => {
    mocks.user.findUnique.mockResolvedValue(null)
    expect((await run()).status).toBe(401)
    Object.values(mocks.scheduledScan).forEach(mock => expect(mock).not.toHaveBeenCalled())
  })
  it.each([detail.GET, detail.PATCH, detail.DELETE])('conceals missing and unowned schedule details %#', async handler => {
    for (const value of [null, { userId: 'someone-else' }]) {
      mocks.scheduledScan.findUnique.mockResolvedValue(value)
      expect((await handler(req('PATCH', {}), params())).status).toBe(404)
    }
    expect(mocks.scheduledScan.update).not.toHaveBeenCalled()
    expect(mocks.scheduledScan.delete).not.toHaveBeenCalled()
  })
  it.each(routes)('does not conceal infrastructure errors as success for %s', async (_, run) => {
    mocks.getUser.mockRejectedValue(new Error('offline'))
    expect((await run()).status).toBe(500)
  })
})

describe('scheduled scan persistence', () => {
  it('scopes schedules to the application account id', async () => {
    expect((await collection.GET(req())).status).toBe(200)
    expect(mocks.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } })
    expect(mocks.scheduledScan.findMany.mock.calls[0][0].where).toEqual({ userId: 'db-owner' })
  })
  it.each([null, { id: 's1', userId: 'other' }])('does not create a schedule for an inaccessible site %#', async site => {
    mocks.site.findUnique.mockResolvedValue(site)
    expect((await collection.POST(req('POST', { siteId: 's1', frequency: 'daily' }))).status).toBe(404)
    expect(mocks.scheduledScan.create).not.toHaveBeenCalled()
  })
  it.each([
    ['daily', undefined, undefined, '16:00', new Date(2026, 8, 6, 16)],
    ['daily', undefined, undefined, '09:00', new Date(2026, 8, 7, 9)],
    ['weekly', 0, undefined, '16:00', new Date(2026, 8, 6, 16)],
    ['weekly', 0, undefined, '09:00', new Date(2026, 8, 13, 9)],
    ['weekly', 2, undefined, '09:00', new Date(2026, 8, 8, 9)],
    ['monthly', undefined, 10, '09:00', new Date(2026, 8, 10, 9)],
    ['monthly', undefined, 2, '09:00', new Date(2026, 9, 2, 9)],
  ] as const)('schedules the next %s occurrence %#', async (frequency, dayOfWeek, dayOfMonth, timeOfDay, expected) => {
    const response = await collection.POST(req('POST', { siteId: 's1', frequency, dayOfWeek, dayOfMonth, timeOfDay }))
    expect(response.status).toBe(201)
    expect(mocks.scheduledScan.create.mock.calls[0][0].data).toMatchObject({ userId: 'db-owner', frequency, dayOfWeek: frequency === 'weekly' ? dayOfWeek : null, dayOfMonth: frequency === 'monthly' ? dayOfMonth : null, timeOfDay, nextRunAt: expected, emailOnComplete: true, emailOnIssues: true, webhookUrl: null })
  })
  it('honors explicit notification preferences and defaults midnight', async () => {
    await collection.POST(req('POST', { siteId: 's1', frequency: 'daily', emailOnComplete: false, emailOnIssues: false, webhookUrl: 'https://example.com/hook' }))
    expect(mocks.scheduledScan.create.mock.calls[0][0].data).toMatchObject({ timeOfDay: '00:00', nextRunAt: new Date(2026, 8, 7), emailOnComplete: false, emailOnIssues: false, webhookUrl: 'https://example.com/hook' })
  })
  it('preserves fields not changed and skips recalculation for notification changes', async () => {
    const body = { active: false, emailOnComplete: false, emailOnIssues: true, webhookUrl: null }
    expect((await detail.PATCH(req('PATCH', body), params())).status).toBe(200)
    expect(mocks.scheduledScan.update.mock.calls[0][0].data).toEqual(body)
  })
  it('retains weekly frequency when changing only the weekday', async () => {
    await detail.PATCH(req('PATCH', { dayOfWeek: 2 }), params())
    expect(mocks.scheduledScan.update.mock.calls[0][0].data).toEqual({ dayOfWeek: 2, nextRunAt: new Date(2026, 8, 8, 9) })
  })
  it('retains monthly frequency when changing only day-of-month', async () => {
    mocks.scheduledScan.findUnique.mockResolvedValue({ ...existing, frequency: 'monthly', dayOfMonth: 15 })
    await detail.PATCH(req('PATCH', { dayOfMonth: 10 }), params())
    expect(mocks.scheduledScan.update.mock.calls[0][0].data).toEqual({ dayOfMonth: 10, nextRunAt: new Date(2026, 8, 10, 9) })
  })
  it.each([
    [{ frequency: 'daily', dayOfWeek: 1, dayOfMonth: 2, timeOfDay: '16:00' }, new Date(2026, 8, 6, 16)],
    [{ frequency: 'daily', timeOfDay: '09:00' }, new Date(2026, 8, 7, 9)],
    [{ frequency: 'weekly', dayOfWeek: 0, timeOfDay: '16:00' }, new Date(2026, 8, 6, 16)],
    [{ frequency: 'weekly', dayOfWeek: 0 }, new Date(2026, 8, 13, 9)],
    [{ frequency: 'monthly', dayOfMonth: 2 }, new Date(2026, 9, 2, 9)],
  ])('recalculates changed schedule %#', async (body, expected) => {
    await detail.PATCH(req('PATCH', body), params())
    expect(mocks.scheduledScan.update.mock.calls[0][0].data.nextRunAt).toEqual(expected)
  })
  it('returns and deletes an owned schedule', async () => {
    expect((await (await detail.GET(req(), params())).json()).data.scheduledScan.id).toBe('schedule1')
    expect((await detail.DELETE(req('DELETE'), params())).status).toBe(200)
    expect(mocks.scheduledScan.delete).toHaveBeenCalledWith({ where: { id: 'schedule1' } })
  })
  it.each([
    ['list', () => collection.GET(req()), () => mocks.scheduledScan.findMany], ['create', () => collection.POST(req('POST', { siteId: 's1', frequency: 'daily' })), () => mocks.scheduledScan.create],
    ['detail', () => detail.GET(req(), params()), () => mocks.scheduledScan.findUnique], ['update', () => detail.PATCH(req('PATCH', {}), params()), () => mocks.scheduledScan.update], ['delete', () => detail.DELETE(req('DELETE'), params()), () => mocks.scheduledScan.delete],
  ] as const)('reports database failure during %s', async (_, run, target) => {
    target().mockRejectedValue(new Error('database unavailable'))
    expect((await run()).status).toBe(500)
  })
})
