import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const mock = vi.hoisted(() => ({ auth: vi.fn(), find: vi.fn(), upsert: vi.fn() }))
vi.mock('@/lib/supabase/server-new', () => ({ createClient: async () => ({ auth: { getUser: mock.auth } }) }))
vi.mock('@/lib/prisma', () => ({ prisma: { billingProfile: { findUnique: mock.find, upsert: mock.upsert } } }))
import { GET, PUT } from './route'
const req = (body: unknown) => new NextRequest('https://app.example.test/api/billing/profile', { method: 'PUT', body: JSON.stringify(body) })
beforeEach(() => { vi.resetAllMocks(); vi.spyOn(console, 'error').mockImplementation(() => {}); mock.auth.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }); mock.find.mockResolvedValue(null); mock.upsert.mockImplementation(({ create }) => create) })
afterEach(() => vi.restoreAllMocks())
it.each([{ data: { user: null }, error: null }, { data: { user: { id: 'u1' } }, error: { message: 'expired' } }])('denies reads and writes without a valid session', async result => { mock.auth.mockResolvedValue(result); expect((await GET()).status).toBe(401); expect((await PUT(req({}))).status).toBe(401); expect(mock.find).not.toHaveBeenCalled(); expect(mock.upsert).not.toHaveBeenCalled() })
it('returns the profile for the session identity only', async () => { mock.find.mockResolvedValue({ id: 'b1', userId: 'u1' }); expect(await (await GET()).json()).toEqual({ profile: { id: 'b1', userId: 'u1' } }); expect(mock.find).toHaveBeenCalledWith({ where: { userId: 'u1' } }) })
it.each([{}, { billingType: 'business', countryCode: 'NLD' }, { billingType: 'business', countryCode: 'NL', companyName: ' ' }])('rejects invalid profile input %j', async body => { expect((await PUT(req(body))).status).toBe(400); expect(mock.upsert).not.toHaveBeenCalled() })
it('normalizes country and writes optional blank fields as null, ignoring a supplied owner', async () => { expect((await PUT(req({ billingType: 'individual', countryCode: 'nl', userId: 'other' }))).status).toBe(200); expect(mock.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'u1' }, create: expect.objectContaining({ userId: 'u1', countryCode: 'NL', companyName: null, vatId: null, addressLine1: null }) })) })
it('preserves all provided invoice fields without accepting VAT validation status from the client', async () => {
  const body = { billingType: 'business', countryCode: 'DE', fullName: 'Example Person', companyName: 'Example GmbH', vatId: 'DE123', kvkNumber: '12345678', registrationNumber: 'REG1', taxId: 'TAX1', addressLine1: 'Street 1', addressCity: 'Berlin', addressPostal: '10115', addressRegion: 'Berlin', vatValid: true }
  await PUT(req(body)); const data = mock.upsert.mock.calls[0][0].update; expect(data).toMatchObject({ companyName: 'Example GmbH', vatId: 'DE123', addressCity: 'Berlin', registrationNumber: 'REG1', taxId: 'TAX1' }); expect(data).not.toHaveProperty('vatValid')
})
it('returns controlled errors for read and write failures', async () => { mock.find.mockRejectedValue(new Error('db failed')); mock.upsert.mockRejectedValue(new Error('db failed')); expect((await GET()).status).toBe(500); expect((await PUT(req({ billingType: 'individual', countryCode: 'NL' }))).status).toBe(500) })
