import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import * as collection from './route'
import * as detail from './[id]/route'
const mocks = vi.hoisted(() => ({ auth: vi.fn(), next: vi.fn(), site: { findFirst: vi.fn() }, scanSchedule: { findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() } }))
vi.mock('@/lib/auth', () => ({ requireAuth: mocks.auth }))
vi.mock('@/lib/prisma', () => ({ prisma: mocks }))
vi.mock('@/lib/schedule-utils', () => ({ calculateNextRunAt: mocks.next }))
const req = (method = 'GET', body?: unknown) => new NextRequest('http://localhost/api/schedules', { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
const params = () => ({ params: Promise.resolve({ id: 'sched1' }) })
const existing = { id: 'sched1', userId: 'owner', frequency: 'WEEKLY', daysOfWeek: [1], dayOfMonth: null, timeOfDay: '09:00', timezone: 'Europe/Amsterdam', startsAt: new Date('2026-01-01'), endsAt: null }
const routes = [['list', () => collection.GET(req())], ['create', () => collection.POST(req('POST', { siteId: 's1' }))], ['detail', () => detail.GET(req(), params())], ['update', () => detail.PATCH(req('PATCH', {}), params())], ['delete', () => detail.DELETE(req('DELETE'), params())]] as const
beforeEach(() => {
  vi.resetAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  mocks.auth.mockResolvedValue({ id: 'owner' })
  mocks.site.findFirst.mockResolvedValue({ id: 's1', userId: 'owner' })
  mocks.scanSchedule.count.mockResolvedValue(0)
  mocks.scanSchedule.findFirst.mockResolvedValue(existing)
  mocks.scanSchedule.findMany.mockResolvedValue([])
  mocks.scanSchedule.create.mockResolvedValue(existing)
  mocks.scanSchedule.update.mockResolvedValue(existing)
  mocks.next.mockReturnValue(new Date('2026-09-07T07:00:00Z'))
})

describe('schedule tenant boundary', () => {
  it.each(routes)('blocks data access after auth failure on %s', async (_, run) => {
    mocks.auth.mockRejectedValue(new Error('Authentication required'))
    expect((await run()).ok).toBe(false)
    Object.values(mocks.scanSchedule).forEach(mock => expect(mock).not.toHaveBeenCalled())
  })
  it.each(routes)('handles thrown non-Error failures on %s', async (_, run) => {
    mocks.auth.mockRejectedValue('unavailable')
    expect(await (await run()).json()).toEqual({ success: false, error: 'Internal server error' })
  })
  it.each([['detail', detail.GET, 'GET'], ['update', detail.PATCH, 'PATCH'], ['delete', detail.DELETE, 'DELETE']] as const)('scopes %s lookup and hides missing/unowned schedules', async (_, handler, method) => {
    mocks.scanSchedule.findFirst.mockResolvedValue(null)
    expect((await handler(req(method, method === 'PATCH' ? {} : undefined), params())).status).toBe(404)
    expect(mocks.scanSchedule.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'sched1', userId: 'owner' } }))
    expect(mocks.scanSchedule.update).not.toHaveBeenCalled()
    expect(mocks.scanSchedule.delete).not.toHaveBeenCalled()
  })
  it('checks site ownership before creating schedules', async () => {
    mocks.site.findFirst.mockResolvedValue(null)
    expect((await collection.POST(req('POST', { siteId: 's1' }))).status).toBe(404)
    expect(mocks.site.findFirst).toHaveBeenCalledWith({ where: { id: 's1', userId: 'owner' } })
    expect(mocks.scanSchedule.create).not.toHaveBeenCalled()
  })
  it('lists only the authenticated user’s schedules and ten latest runs', async () => {
    expect(await (await collection.GET(req())).json()).toEqual({ success: true, schedules: [] })
    expect(mocks.scanSchedule.findMany.mock.calls[0][0]).toMatchObject({ where: { userId: 'owner' }, include: { runs: { take: 10, orderBy: { startedAt: 'desc' } } } })
  })
})

describe('schedule validation and defaults', () => {
  it.each([
    [{}, 'siteId'], [{ siteId: 's1', frequency: 'HOURLY' }, 'frequency'],
    [{ siteId: 's1', deliverFormat: 'ZIP' }, 'delivery format'], [{ siteId: 's1', timeOfDay: '9am' }, 'HH:MM'],
    [{ siteId: 's1', recipients: ['invalid'] }, 'Invalid email'],
    [{ siteId: 's1', recipients: Array(21).fill('test@example.com') }, 'Maximum 20'],
    [{ siteId: 's1', daysOfWeek: [] }, 'At least one day'],
    [{ siteId: 's1', daysOfWeek: [-1] }, '0-6'], [{ siteId: 's1', daysOfWeek: [7] }, '0-6'],
  ])('rejects invalid creation %#', async (body, error) => {
    const response = await collection.POST(req('POST', body))
    expect(response.status).toBe(400)
    expect((await response.json()).error).toContain(error)
    expect(mocks.scanSchedule.create).not.toHaveBeenCalled()
  })
  it('enforces the schedule count ceiling', async () => {
    mocks.scanSchedule.count.mockResolvedValue(20)
    expect((await collection.POST(req('POST', { siteId: 's1' }))).status).toBe(429)
    expect(mocks.scanSchedule.create).not.toHaveBeenCalled()
  })
  it('creates weekly local-time schedules with explicit defaults', async () => {
    expect((await collection.POST(req('POST', { siteId: 's1' }))).status).toBe(201)
    expect(mocks.scanSchedule.create.mock.calls[0][0].data).toEqual({ userId: 'owner', siteId: 's1', isEnabled: true, timezone: 'Europe/Amsterdam', frequency: 'WEEKLY', daysOfWeek: [1], dayOfMonth: null, timeOfDay: '09:00', startsAt: expect.any(Date), endsAt: null, nextRunAt: new Date('2026-09-07T07:00:00Z'), recipients: [], deliverFormat: 'PDF', includeExecutiveSummaryOnly: false })
  })
  it.each(['DAILY', 'WEEKLY', 'MONTHLY'])('retains explicit creation options for %s', async frequency => {
    const body = { siteId: 's1', isEnabled: false, timezone: 'UTC', frequency, daysOfWeek: [2, 5], dayOfMonth: 15, timeOfDay: '15:30', startsAt: '2026-09-07', endsAt: '2026-12-31', recipients: ['test@example.com'], deliverFormat: 'PDF_AND_DOCX', includeExecutiveSummaryOnly: true }
    expect((await collection.POST(req('POST', body))).status).toBe(201)
    expect(mocks.next).toHaveBeenCalledWith({ frequency, daysOfWeek: [2, 5], dayOfMonth: 15, timeOfDay: '15:30', timezone: 'UTC', startsAt: new Date('2026-09-07'), endsAt: new Date('2026-12-31') })
    expect(mocks.scanSchedule.create.mock.calls[0][0].data).toMatchObject({ isEnabled: false, recipients: ['test@example.com'], deliverFormat: 'PDF_AND_DOCX', includeExecutiveSummaryOnly: true })
  })
})

describe('schedule updates', () => {
  it.each([
    { timeOfDay: '9am' }, { recipients: 'test@example.com' }, { recipients: ['invalid'] },
    { recipients: Array(21).fill('test@example.com') }, { deliverFormat: 'ZIP' },
  ])('rejects invalid updates %#', async body => {
    expect((await detail.PATCH(req('PATCH', body), params())).status).toBe(400)
    expect(mocks.scanSchedule.update).not.toHaveBeenCalled()
  })
  it.each([{}, { isEnabled: false }, { recipients: ['test@example.com'], deliverFormat: 'PDF_AND_HTML', includeExecutiveSummaryOnly: true }])('does not reschedule when only delivery settings change %#', async body => {
    expect((await detail.PATCH(req('PATCH', body), params())).status).toBe(200)
    expect(mocks.scanSchedule.update.mock.calls[0][0].data).toEqual(body)
    expect(mocks.next).not.toHaveBeenCalled()
  })
  it.each([
    { frequency: 'DAILY' }, { daysOfWeek: [3] }, { dayOfMonth: 10 }, { timeOfDay: '16:30' },
    { timezone: 'UTC' }, { startsAt: '2026-10-01' }, { endsAt: '2026-12-01' },
    { startsAt: null }, { endsAt: null }, { dayOfMonth: null },
  ])('recalculates after a schedule field changes, including cleared dates %#', async body => {
    expect((await detail.PATCH(req('PATCH', body), params())).status).toBe(200)
    expect(mocks.next).toHaveBeenCalledOnce()
    const config = mocks.next.mock.calls[0][0]
    for (const [key, value] of Object.entries(body)) {
      if (key === 'startsAt') expect(config.startsAt).toEqual(value ? new Date(String(value)) : expect.any(Date))
      else if (key === 'endsAt') expect(config.endsAt).toEqual(value ? new Date(String(value)) : null)
      else expect(config[key]).toEqual(value)
    }
    expect(mocks.scanSchedule.update.mock.calls[0][0].data.nextRunAt).toEqual(new Date('2026-09-07T07:00:00Z'))
  })
  it('returns details and deletes an owned schedule', async () => {
    expect((await (await detail.GET(req(), params())).json()).schedule.id).toBe('sched1')
    expect(await (await detail.DELETE(req('DELETE'), params())).json()).toEqual({ success: true })
    expect(mocks.scanSchedule.delete).toHaveBeenCalledWith({ where: { id: 'sched1' } })
  })
  it.each([
    ['list', () => collection.GET(req()), () => mocks.scanSchedule.findMany],
    ['create', () => collection.POST(req('POST', { siteId: 's1' })), () => mocks.scanSchedule.create],
    ['detail', () => detail.GET(req(), params()), () => mocks.scanSchedule.findFirst],
    ['update', () => detail.PATCH(req('PATCH', {}), params()), () => mocks.scanSchedule.update],
    ['delete', () => detail.DELETE(req('DELETE'), params()), () => mocks.scanSchedule.delete],
  ] as const)('reports storage failure on %s', async (_, run, target) => {
    target().mockRejectedValue(new Error('storage unavailable'))
    expect((await run()).status).toBe(500)
  })
})
