import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from './route'
import { PUT, DELETE } from './[id]/route'
import { POST as markAllRead } from './mark-all-read/route'

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  notification: Object.fromEntries(['create', 'findMany', 'count', 'findUnique', 'update', 'delete', 'updateMany'].map(key => [key, vi.fn()])),
}))
vi.mock('@/lib/supabase/server-new', () => ({ createClient: () => ({ auth: { getUser: mocks.getUser } }) }))
vi.mock('@/lib/prisma', () => ({ prisma: { notification: mocks.notification } }))

const request = (method = 'GET', body?: unknown, query = '') => new NextRequest(`http://localhost/api/notifications${query}`, {
  method, ...(body === undefined ? {} : { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }),
})
const params = () => ({ params: Promise.resolve({ id: 'notice-1' }) })
const operations = [
  ['list', () => GET(request())], ['create', () => POST(request('POST', {}))],
  ['read', () => PUT(request('PUT'), params())], ['delete', () => DELETE(request('DELETE'), params())],
  ['read all', () => markAllRead(request('POST'))],
] as const

beforeEach(() => {
  vi.resetAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  mocks.getUser.mockResolvedValue({ data: { user: { id: 'owner' } }, error: null })
  mocks.notification.findUnique.mockResolvedValue({ id: 'notice-1', userId: 'owner' })
})

describe('notification authorization', () => {
  it.each(operations)('rejects anonymous %s before database access', async (_, run) => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null })
    expect((await run()).status).toBe(401)
    Object.values(mocks.notification).forEach(mock => expect(mock).not.toHaveBeenCalled())
  })
  it.each(operations)('rejects an invalid session for %s even with a user object', async (_, run) => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'owner' } }, error: new Error('expired') })
    expect((await run()).status).toBe(401)
  })
  it.each([['read', PUT, 'update'], ['delete', DELETE, 'delete']] as const)('%s enforces ownership and existence', async (_, handler, mutation) => {
    mocks.notification.findUnique.mockResolvedValueOnce(null)
    expect((await handler(request('DELETE'), params())).status).toBe(404)
    mocks.notification.findUnique.mockResolvedValueOnce({ userId: 'another-user' })
    expect((await handler(request('DELETE'), params())).status).toBe(403)
    expect(mocks.notification[mutation]).not.toHaveBeenCalled()
  })
})

describe('notification list and mutations', () => {
  it.each([['', 1, 20, false], ['?page=3&limit=5&unread=true', 3, 5, true]] as const)('scopes and paginates %s', async (query, page, limit, unread) => {
    const notices = [{ id: 'notice-1', title: 'Scan ready' }]
    mocks.notification.findMany.mockResolvedValue(notices)
    mocks.notification.count.mockResolvedValueOnce(21).mockResolvedValueOnce(4)
    const response = await GET(request('GET', undefined, query))
    expect(response.status).toBe(200)
    expect((await response.json()).data).toEqual({ notifications: notices, pagination: { page, limit, total: 21, pages: Math.ceil(21 / limit) }, unreadCount: 4 })
    expect(mocks.notification.findMany).toHaveBeenCalledWith({ where: { userId: 'owner', ...(unread ? { read: false } : {}) }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit })
    expect(mocks.notification.count).toHaveBeenLastCalledWith({ where: { userId: 'owner', read: false } })
  })
  it.each([
    {}, { type: 'UNKNOWN', title: 'Title', message: 'Body' },
    { type: 'SCAN_COMPLETE', title: '', message: 'Body' },
    { type: 'SCAN_COMPLETE', title: 'Title', message: 'x'.repeat(5001) },
    { type: 'SCAN_COMPLETE', title: 'Title', message: 'Body', link: 'not-a-url' },
  ])('rejects invalid notification %#', async body => {
    const response = await POST(request('POST', body))
    expect(response.status).toBe(400)
    expect((await response.json()).code).toBe('VALIDATION_ERROR')
    expect(mocks.notification.create).not.toHaveBeenCalled()
  })
  it.each([undefined, null, 'https://example.com/report'])('creates only for authenticated user with link %s', async link => {
    const body = { type: 'SCAN_COMPLETE', title: 'Ready', message: 'Your scan is ready', link, metadata: { scanId: 'scan-1' }, userId: 'attacker-selected' }
    mocks.notification.create.mockResolvedValue({ id: 'new' })
    expect((await POST(request('POST', body))).status).toBe(201)
    expect(mocks.notification.create).toHaveBeenCalledWith({ data: { userId: 'owner', type: body.type, title: body.title, message: body.message, link, metadata: body.metadata } })
  })
  it('marks an owned notification read with a timestamp', async () => {
    mocks.notification.update.mockResolvedValue({ id: 'notice-1', read: true })
    expect((await PUT(request('PUT'), params())).status).toBe(200)
    expect(mocks.notification.update).toHaveBeenCalledWith({ where: { id: 'notice-1' }, data: { read: true, readAt: expect.any(Date) } })
  })
  it('deletes only the requested owned notification', async () => {
    expect((await DELETE(request('DELETE'), params())).status).toBe(200)
    expect(mocks.notification.delete).toHaveBeenCalledWith({ where: { id: 'notice-1' } })
  })
  it('marks only this user’s unread notifications', async () => {
    mocks.notification.updateMany.mockResolvedValue({ count: 3 })
    const response = await markAllRead(request('POST'))
    expect((await response.json()).data.count).toBe(3)
    expect(mocks.notification.updateMany).toHaveBeenCalledWith({ where: { userId: 'owner', read: false }, data: { read: true, readAt: expect.any(Date) } })
  })
  it.each(operations)('handles unavailable authentication safely for %s', async (_, run) => {
    mocks.getUser.mockRejectedValue(new Error('session service unavailable'))
    expect((await run()).status).toBe(500)
  })
  it.each([
    ['list', 'findMany', () => GET(request())],
    ['create', 'create', () => POST(request('POST', { type: 'SCAN_COMPLETE', title: 'Ready', message: 'Ready' }))],
    ['read', 'update', () => PUT(request('PUT'), params())],
    ['delete', 'delete', () => DELETE(request('DELETE'), params())],
    ['read all', 'updateMany', () => markAllRead(request('POST'))],
  ] as const)('reports failed persistence for %s', async (_, method, run) => {
    mocks.notification[method].mockRejectedValue(new Error('database unavailable'))
    expect((await run()).status).toBe(500)
  })
})
