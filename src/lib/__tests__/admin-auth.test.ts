import { beforeEach, describe, expect, it, vi } from 'vitest'

const requireAdminAPIMock = vi.fn()

vi.mock('../auth', () => ({
  requireAdminAPI: requireAdminAPIMock,
}))

describe('assertAdmin', () => {
  beforeEach(() => {
    requireAdminAPIMock.mockReset()
  })

  it('passes when requireAdminAPI passes', async () => {
    requireAdminAPIMock.mockResolvedValue({ id: 'admin-user' })
    const { assertAdmin } = await import('../adminAuth')

    await expect(assertAdmin()).resolves.toBeUndefined()
    expect(requireAdminAPIMock).toHaveBeenCalledOnce()
  })

  it('throws when requireAdminAPI rejects', async () => {
    requireAdminAPIMock.mockRejectedValue(new Error('Unauthorized: Admin access required'))
    const { assertAdmin } = await import('../adminAuth')

    await expect(assertAdmin()).rejects.toThrow(/admin access required/i)
  })
})
