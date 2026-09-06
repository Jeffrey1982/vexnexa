import { beforeEach, expect, it, vi } from 'vitest'
const db = vi.hoisted(() => ({ mollieProduct: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), findMany: vi.fn() } }))
vi.mock('../prisma', () => ({ prisma: db }))
import { syncMollieProducts, getActiveProducts, getProductRecord } from './mollie-sync'
import { BASE_PRICES, ANNUAL_PRICES, WEBSITE_PACK_PRICES } from '../pricing'
beforeEach(() => vi.resetAllMocks())
it('creates the full local catalog with configured prices and EUR currency', async () => {
  db.mollieProduct.findFirst.mockResolvedValue(null)
  const result = await syncMollieProducts(); expect(result.errors).toEqual([]); expect(result.created).toBe(db.mollieProduct.create.mock.calls.length); expect(result.created).toBeGreaterThan(10)
  expect(db.mollieProduct.create).toHaveBeenCalledWith({ data: expect.objectContaining({ productKey: 'PRO', interval: 'monthly', amount: BASE_PRICES.PRO, currency: 'EUR', active: true }) })
  expect(db.mollieProduct.create).toHaveBeenCalledWith({ data: expect.objectContaining({ productKey: 'PRO', interval: 'yearly', amount: ANNUAL_PRICES.PRO }) })
  expect(db.mollieProduct.create).toHaveBeenCalledWith({ data: expect.objectContaining({ productKey: 'EXTRA_WEBSITE_5', amount: WEBSITE_PACK_PRICES.EXTRA_WEBSITE_5 }) })
})
it('leaves identical prices untouched on repeated synchronization', async () => {
  const catalog = new Map<string, unknown>()
  db.mollieProduct.findFirst.mockImplementation(({ where }) => catalog.get(`${where.productKey}/${where.interval}`) ?? null)
  db.mollieProduct.create.mockImplementation(({ data }) => { catalog.set(`${data.productKey}/${data.interval}`, { ...data, id: 'p1' }); return data })
  await syncMollieProducts(); db.mollieProduct.create.mockClear()
  expect(await syncMollieProducts()).toEqual({ created: 0, updated: 0, unchanged: catalog.size, errors: [] }); expect(db.mollieProduct.create).not.toHaveBeenCalled(); expect(db.mollieProduct.update).not.toHaveBeenCalled()
})
it('deactivates changed prices and creates replacements retaining provider product IDs', async () => {
  db.mollieProduct.findFirst.mockResolvedValue({ id: 'old', amount: -1, mollieProductId: 'provider-id' })
  const result = await syncMollieProducts(); expect(result.updated).toBeGreaterThan(10); expect(result.created).toBe(0)
  expect(db.mollieProduct.update).toHaveBeenCalledWith({ where: { id: 'old' }, data: { active: false } }); expect(db.mollieProduct.create).toHaveBeenCalledWith({ data: expect.objectContaining({ mollieProductId: 'provider-id', active: true }) })
})
it('records individual errors and continues syncing other products', async () => {
  db.mollieProduct.findFirst.mockRejectedValueOnce(new Error('db unavailable')).mockRejectedValueOnce('timeout').mockResolvedValue(null)
  const result = await syncMollieProducts(); expect(result.errors).toEqual(['STARTER/monthly: db unavailable', 'STARTER/yearly: timeout']); expect(result.created).toBeGreaterThan(0)
})
it('filters active catalog lookups and preserves requested product and interval', async () => {
  await getActiveProducts(); await getProductRecord('PRO', 'yearly')
  expect(db.mollieProduct.findMany).toHaveBeenCalledWith({ where: { active: true }, orderBy: [{ productType: 'asc' }, { productKey: 'asc' }, { interval: 'asc' }] })
  expect(db.mollieProduct.findFirst).toHaveBeenCalledWith({ where: { productKey: 'PRO', interval: 'yearly', active: true } })
})
