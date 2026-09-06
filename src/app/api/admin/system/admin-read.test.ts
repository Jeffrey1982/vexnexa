import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as users } from '../users/route'
import { GET as auditLogs } from '../audit-logs/route'
import { GET as apiLogs } from './api-logs/route'
import { GET as apiStats } from './api-stats/route'
import { GET as errors } from './errors/route'
import { GET as health } from './health/route'
import { GET as performance } from './performance/route'

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(), isAdmin: vi.fn(), queryRaw: vi.fn(),
  user: { findMany: vi.fn(), count: vi.fn() }, site: { count: vi.fn() },
  scan: { findMany: vi.fn(), count: vi.fn() },
  auditLog: { findMany: vi.fn(), count: vi.fn() },
  apiLog: { findMany: vi.fn(), count: vi.fn(), aggregate: vi.fn(), groupBy: vi.fn() },
  errorLog: { findMany: vi.fn(), count: vi.fn() },
}))
vi.mock('@/lib/supabase/server-new', () => ({ createClient: () => ({ auth: { getUser: mocks.getUser } }) }))
vi.mock('@/lib/admin', () => ({ isAdmin: mocks.isAdmin }))
vi.mock('@/lib/prisma', () => ({ prisma: { ...mocks, $queryRaw: mocks.queryRaw } }))
const req = (query = '') => new NextRequest(`http://localhost/api/admin${query}`)
const routes = [['users', users], ['audit logs', auditLogs], ['API logs', apiLogs], ['API stats', apiStats], ['errors', errors], ['health', health], ['performance', performance]] as const
const date = new Date('2026-09-06T10:00:00Z')

beforeEach(() => {
  vi.resetAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  mocks.getUser.mockResolvedValue({ data: { user: { id: 'admin' } }, error: null })
  mocks.isAdmin.mockResolvedValue(true)
  for (const model of [mocks.user, mocks.scan, mocks.auditLog, mocks.apiLog, mocks.errorLog]) model.findMany.mockResolvedValue([])
  for (const model of [mocks.user, mocks.site, mocks.scan, mocks.auditLog, mocks.apiLog, mocks.errorLog]) model.count.mockResolvedValue(0)
  mocks.apiLog.aggregate.mockResolvedValue({ _avg: { duration: null } })
  mocks.apiLog.groupBy.mockResolvedValue([])
})

describe('administrative read access', () => {
  it.each(routes)('blocks anonymous access to %s', async (_, handler) => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null })
    expect((await handler(req())).status).toBe(401)
    expect(mocks.isAdmin).not.toHaveBeenCalled()
  })
  it.each(routes)('blocks invalid sessions for %s', async (_, handler) => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'admin' } }, error: new Error('expired') })
    expect((await handler(req())).status).toBe(401)
    expect(mocks.isAdmin).not.toHaveBeenCalled()
  })
  it.each(routes)('blocks regular accounts from %s', async (_, handler) => {
    mocks.isAdmin.mockResolvedValue(false)
    expect((await handler(req())).status).toBe(403)
    expect(mocks.isAdmin).toHaveBeenCalledWith('admin')
    for (const model of [mocks.user, mocks.scan, mocks.auditLog, mocks.apiLog, mocks.errorLog]) expect(model.findMany).not.toHaveBeenCalled()
    expect(mocks.queryRaw).not.toHaveBeenCalled()
  })
  it.each(routes)('fails closed when auth fails for %s', async (_, handler) => {
    mocks.getUser.mockRejectedValue(new Error('auth unavailable'))
    expect((await handler(req())).status).toBe(500)
  })
  it.each(routes)('supports empty data for authorized %s', async (_, handler) => {
    const response = await handler(req())
    expect(response.status).toBe(200)
    expect((await response.json()).success).toBe(true)
  })
})

describe('administrative query semantics', () => {
  it('does not include deleted users or sensitive authentication columns', async () => {
    mocks.user.findMany.mockResolvedValue([{ id: 'u1', email: 'test@example.com' }])
    expect((await (await users(req())).json()).data).toEqual([{ id: 'u1', email: 'test@example.com' }])
    expect(mocks.user.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' } }))
    const select = mocks.user.findMany.mock.calls[0][0].select
    expect(select).not.toHaveProperty('password')
    expect(select).not.toHaveProperty('mollieCustomerId')
  })
  it('combines audit filters and pagination consistently for list and count', async () => {
    mocks.auditLog.findMany.mockResolvedValue([{ id: 'a1' }])
    mocks.auditLog.count.mockResolvedValue(13)
    const result = (await (await auditLogs(req('?page=2&limit=5&action=delete&entity=site&email=admin'))).json()).data
    expect(result.pagination).toEqual({ page: 2, limit: 5, total: 13, pages: 3 })
    const where = { action: { contains: 'delete', mode: 'insensitive' }, entity: 'site', actorEmail: { contains: 'admin', mode: 'insensitive' } }
    expect(mocks.auditLog.findMany).toHaveBeenCalledWith({ where, orderBy: { createdAt: 'desc' }, skip: 5, take: 5 })
    expect(mocks.auditLog.count).toHaveBeenCalledWith({ where })
  })
  it('serializes API log dates and respects an explicit limit', async () => {
    mocks.apiLog.findMany.mockResolvedValue([{ id: 'l1', createdAt: date, method: 'GET' }])
    expect((await (await apiLogs(req('?limit=10'))).json()).data.logs).toEqual([{ id: 'l1', createdAt: date.toISOString(), method: 'GET' }])
    expect(mocks.apiLog.findMany.mock.calls[0][0].take).toBe(10)
  })
  it('calculates API statistics from independent aggregate results', async () => {
    mocks.scan.count.mockResolvedValueOnce(2).mockResolvedValueOnce(9)
    mocks.site.count.mockResolvedValue(3)
    mocks.user.count.mockResolvedValue(4)
    mocks.apiLog.count.mockResolvedValueOnce(100).mockResolvedValueOnce(7)
    mocks.apiLog.aggregate.mockResolvedValue({ _avg: { duration: 12.7 } })
    mocks.apiLog.groupBy.mockResolvedValue([{ path: '/api/scan', method: 'POST', _count: 8 }])
    const result = (await (await apiStats(req())).json()).data
    expect(result.periods).toEqual({ last24h: { scans: 2, newSites: 3, newUsers: 4, apiCalls: 100, apiErrors: 7, avgResponseTime: 13 }, last7d: { scans: 9 } })
    expect(result.topEndpoints).toEqual([{ path: '/api/scan', method: 'POST', calls: 8 }])
    expect(mocks.apiLog.count.mock.calls[1][0].where.statusCode).toEqual({ gte: 400 })
  })
  it('returns error counts and timestamped logs', async () => {
    mocks.errorLog.count.mockResolvedValueOnce(8).mockResolvedValueOnce(2)
    mocks.errorLog.findMany.mockResolvedValue([{ id: 'e1', createdAt: date, level: 'critical' }])
    const result = (await (await errors(req())).json()).data
    expect(result).toEqual({ totalErrors24h: 8, criticalErrors: 2, recentErrors: [{ id: 'e1', createdAt: date.toISOString(), timestamp: date.toISOString(), level: 'critical' }] })
    expect(mocks.errorLog.count.mock.calls[1][0].where.level).toBe('critical')
  })
  it('calculates duration summary including nullable historical data', async () => {
    mocks.scan.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([{ scanDuration: 10 }, { scanDuration: 20 }, { scanDuration: null }])
    const result = (await (await performance(req())).json()).data
    expect(result.scans).toEqual({ count24h: 3, avgDuration: '10ms', minDuration: '0ms', maxDuration: '20ms' })
    expect(result.api.nodeVersion).toBe(process.version)
  })
  it.each([
    ['users', users, () => mocks.user.findMany], ['audit', auditLogs, () => mocks.auditLog.findMany],
    ['logs', apiLogs, () => mocks.apiLog.findMany], ['stats', apiStats, () => mocks.apiLog.aggregate],
    ['errors', errors, () => mocks.errorLog.findMany], ['health stats', health, () => mocks.user.count],
    ['performance', performance, () => mocks.scan.findMany],
  ] as const)('reports storage failure in %s', async (_, handler, target) => {
    target().mockRejectedValue(new Error('database unavailable'))
    expect((await handler(req())).status).toBe(500)
  })
})

describe('health degradation', () => {
  it.each([new Error('database down'), 'database down'])('reports database failures as unhealthy %#', async failure => {
    mocks.queryRaw.mockRejectedValue(failure)
    const result = (await (await health(req())).json()).data
    expect(result.status).toBe('unhealthy')
    expect(result.checks.database).toEqual({ status: 'unhealthy', error: failure instanceof Error ? failure.message : 'Unknown error' })
  })
  it.each([new Error('auth down'), 'auth down'])('reports thrown auth failures as degraded %#', async failure => {
    mocks.getUser.mockResolvedValueOnce({ data: { user: { id: 'admin' } }, error: null }).mockRejectedValueOnce(failure)
    const result = (await (await health(req())).json()).data
    expect(result.status).toBe('degraded')
    expect(result.checks.authentication.status).toBe('unhealthy')
  })
  it('checks resolved Supabase errors and preserves the more severe database failure', async () => {
    mocks.queryRaw.mockRejectedValue(new Error('database down'))
    mocks.getUser.mockResolvedValueOnce({ data: { user: { id: 'admin' } }, error: null }).mockResolvedValueOnce({ data: { user: null }, error: new Error('auth down') })
    const result = (await (await health(req())).json()).data
    expect(result.status).toBe('unhealthy')
    expect(result.checks.authentication).toEqual({ status: 'unhealthy', error: 'auth down' })
  })
})
