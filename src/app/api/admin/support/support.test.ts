import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import * as tickets from './tickets/route'
import * as messages from './messages/route'
import * as logs from './contact-logs/route'

const mocks = vi.hoisted(() => ({ admin: vi.fn(), from: vi.fn(), result: { data: null, count: null, error: null } as { data: unknown; count: number | null; error: unknown }, query: Object.fromEntries(['select', 'order', 'range', 'eq', 'or', 'insert', 'update', 'single'].map(name => [name, vi.fn()])) }))
vi.mock('@/lib/adminAuth', () => ({ assertAdmin: mocks.admin }))
vi.mock('@/lib/supabaseAdmin', () => ({ supabaseAdmin: { from: mocks.from } }))

const req = (method = 'GET', body?: unknown, query = '') => new NextRequest(`http://localhost/api/admin/support${query}`, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
const routes = [
  ['tickets GET', () => tickets.GET(req())], ['tickets POST', () => tickets.POST(req('POST', { email: 'test@example.com', subject: 'Help' }))],
  ['tickets PATCH', () => tickets.PATCH(req('PATCH', { id: 't1' }))], ['messages GET', () => messages.GET(req('GET', undefined, '?ticket_id=t1'))],
  ['messages POST', () => messages.POST(req('POST', { ticket_id: 't1', from_email: 'test@example.com', body: 'Help' }))], ['contact logs', () => logs.GET(req())],
] as const

beforeEach(() => {
  vi.resetAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  mocks.result = { data: null, count: null, error: null }
  const query = { ...mocks.query, then: (resolve: (result: typeof mocks.result) => unknown) => Promise.resolve(mocks.result).then(resolve) }
  mocks.from.mockReturnValue(query)
  Object.values(mocks.query).forEach(mock => mock.mockReturnValue(query))
})

describe('support API authorization and failures', () => {
  it.each(routes)('protects %s before accessing support data', async (_, run) => {
    mocks.admin.mockRejectedValue(new Error('Unauthorized'))
    const response = await run()
    expect(response.status).toBe(401)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(mocks.from).not.toHaveBeenCalled()
  })
  it.each(routes)('handles database errors in %s without claiming success', async (_, run) => {
    mocks.result.error = { message: 'database rejected operation' }
    const response = await run()
    expect(response.status).toBe(500)
    expect((await response.json()).error).toMatch(/^Failed to/)
  })
  it.each(routes)('handles unexpected thrown values in %s', async (_, run) => {
    mocks.admin.mockRejectedValue('unexpected failure')
    const response = await run()
    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: 'Unknown error' })
  })
  it.each(routes)('handles internal exceptions in %s', async (_, run) => {
    mocks.from.mockImplementation(() => { throw new Error('unavailable') })
    expect((await run()).status).toBe(500)
  })
})

describe('support queries', () => {
  it.each([[tickets.GET, 'tickets', 'support_tickets'], [logs.GET, 'logs', 'contact_form_logs']] as const)('uses bounded defaults and empty result fallback %#', async (handler, key, table) => {
    const response = await handler(req())
    expect(await response.json()).toEqual({ [key]: [], total: 0, limit: 50, offset: 0 })
    expect(mocks.from).toHaveBeenCalledWith(table)
    expect(mocks.query.range).toHaveBeenCalledWith(0, 49)
  })
  it('applies ticket search, status, priority and a capped page size', async () => {
    mocks.result = { data: [{ id: 't1' }], count: 1, error: null }
    const response = await tickets.GET(req('GET', undefined, '?limit=900&offset=10&status=open&priority=high&query=accessibility'))
    expect((await response.json()).tickets).toEqual([{ id: 't1' }])
    expect(mocks.query.range).toHaveBeenCalledWith(10, 209)
    expect(mocks.query.eq).toHaveBeenCalledWith('status', 'open')
    expect(mocks.query.eq).toHaveBeenCalledWith('priority', 'high')
    expect(mocks.query.or).toHaveBeenCalledWith('email.ilike.%accessibility%,subject.ilike.%accessibility%')
  })
  it('filters contact logs and retains count', async () => {
    mocks.result = { data: [{ id: 'log1' }], count: 22, error: null }
    const response = await logs.GET(req('GET', undefined, '?limit=1000&offset=5&query=scan'))
    expect((await response.json()).total).toBe(22)
    expect(mocks.query.range).toHaveBeenCalledWith(5, 204)
    expect(mocks.query.or).toHaveBeenCalledWith('email.ilike.%scan%,name.ilike.%scan%,message.ilike.%scan%')
  })
  it('requires a ticket before querying messages', async () => {
    expect((await messages.GET(req())).status).toBe(400)
    expect(mocks.from).not.toHaveBeenCalled()
  })
  it.each([['?ticket_id=t1', 0, 99, null, null], ['?ticket_id=t1&limit=900&offset=4', 4, 503, [{ id: 'm1' }], 1]] as const)('queries messages for a specific ticket %#', async (query, start, end, data, count) => {
    mocks.result = { data, count, error: null }
    expect(await (await messages.GET(req('GET', undefined, query))).json()).toEqual({ messages: data ?? [], total: count ?? 0 })
    expect(mocks.query.eq).toHaveBeenCalledWith('ticket_id', 't1')
    expect(mocks.query.order).toHaveBeenCalledWith('created_at', { ascending: true })
    expect(mocks.query.range).toHaveBeenCalledWith(start, end)
  })
})

describe('support mutations', () => {
  it.each([{}, { email: 'test@example.com' }, { subject: 'Help' }])('requires ticket fields %#', async body => {
    expect((await tickets.POST(req('POST', body))).status).toBe(400)
    expect(mocks.query.insert).not.toHaveBeenCalled()
  })
  it.each([{}, { ticket_id: 't1' }, { ticket_id: 't1', from_email: 'test@example.com' }])('requires message fields %#', async body => {
    expect((await messages.POST(req('POST', body))).status).toBe(400)
    expect(mocks.query.insert).not.toHaveBeenCalled()
  })
  it.each([{}, { user_id: 'u1', priority: 'high' }])('creates tickets with explicit defaults %#', async extra => {
    const body = { email: 'test@example.com', subject: 'Help', ...extra }
    mocks.result.data = { id: 't1' }
    const response = await tickets.POST(req('POST', body))
    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({ ticket: { id: 't1' } })
    expect(mocks.query.insert).toHaveBeenCalledWith({ ...body, user_id: extra.user_id ?? null, priority: extra.priority ?? 'normal', status: 'open' })
  })
  it('persists message content against the selected ticket', async () => {
    const body = { ticket_id: 't1', from_email: 'test@example.com', body: 'Please review scan' }
    mocks.result.data = { id: 'm1' }
    const response = await messages.POST(req('POST', body))
    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({ message: { id: 'm1' } })
    expect(mocks.query.insert).toHaveBeenCalledWith(body)
  })
  it('requires an id for updates', async () => {
    expect((await tickets.PATCH(req('PATCH', {}))).status).toBe(400)
    expect(mocks.query.update).not.toHaveBeenCalled()
  })
  it.each([{}, { status: 'closed' }, { priority: 'urgent' }, { status: 'open', priority: 'low' }])('updates only supplied fields %#', async fields => {
    mocks.result.data = { id: 't1', ...fields }
    expect((await tickets.PATCH(req('PATCH', { id: 't1', ...fields }))).status).toBe(200)
    expect(mocks.query.update).toHaveBeenCalledWith({ updated_at: expect.any(String), ...fields })
    expect(mocks.query.eq).toHaveBeenCalledWith('id', 't1')
  })
})
