import { afterEach, expect, it, vi } from 'vitest'
import { z } from 'zod'
import * as responses from '../api-response'

afterEach(() => vi.unstubAllEnvs())
it.each([
  [responses.unauthorizedResponse, 401, 'UNAUTHORIZED', 'Authentication required'],
  [responses.forbiddenResponse, 403, 'FORBIDDEN', 'Access denied'],
  [responses.notFoundResponse, 404, 'NOT_FOUND', 'Resource not found'],
  [responses.conflictResponse, 409, 'ALREADY_EXISTS', 'Resource already exists'],
  [responses.databaseErrorResponse, 500, 'DATABASE_ERROR', 'Database operation failed'],
] as const)('returns standard %s errors and optional custom copy', async (handler, status, code, message) => {
  const response = handler()
  expect(response.status).toBe(status)
  expect(await response.json()).toMatchObject({ error: message, code, timestamp: expect.any(String) })
  expect((await handler('Custom').json()).error).toBe(handler === responses.notFoundResponse ? 'Custom not found' : 'Custom')
})
it('supports empty and populated success responses', async () => {
  expect(await responses.successResponse().json()).toEqual({ success: true, timestamp: expect.any(String) })
  const response = responses.successResponse({ id: 'one' }, 'Created', 201)
  expect(response.status).toBe(201)
  expect(await response.json()).toEqual({ success: true, data: { id: 'one' }, message: 'Created', timestamp: expect.any(String) })
})
it('supports generic errors and explicit diagnostics', async () => {
  expect(responses.errorResponse('Failure').status).toBe(500)
  const response = responses.errorResponse('Bad input', 422, 'INVALID_INPUT', { field: 'name' })
  expect(response.status).toBe(422)
  expect(await response.json()).toMatchObject({ error: 'Bad input', code: 'INVALID_INPUT', details: { field: 'name' } })
})
it('maps nested validation paths without exposing the submitted data', async () => {
  const parsed = z.object({ account: z.object({ email: z.string().email() }) }).safeParse({ account: { email: 'private-invalid-value' } })
  if (parsed.success) throw new Error('Expected invalid fixture')
  const response = responses.validationErrorResponse(parsed.error)
  expect(response.status).toBe(400)
  const body = await response.json()
  expect(body.details[0].path).toBe('account.email')
  expect(JSON.stringify(body)).not.toContain('private-invalid-value')
})
it('returns retry information in both header and body', async () => {
  const response = responses.rateLimitResponse(45)
  expect(response.status).toBe(429)
  expect(response.headers.get('retry-after')).toBe('45')
  expect((await response.json()).retryAfter).toBe(45)
})
it.each(['production', 'test', 'development'])('limits internal diagnostics in %s', async env => {
  vi.stubEnv('NODE_ENV', env)
  const log = vi.spyOn(console, 'error').mockImplementation(() => {})
  const details = { trace: 'server-only-diagnostic' }
  const response = responses.internalErrorResponse(undefined, details)
  expect(response.status).toBe(500)
  const body = await response.json()
  expect(body.details).toEqual(env === 'development' ? details : undefined)
  expect(log).toHaveBeenCalledWith('Internal error:', details)
  log.mockRestore()
})
it('handles internal errors with no diagnostic details', async () => {
  expect((await responses.internalErrorResponse().json()).error).toBe('An unexpected error occurred')
})
