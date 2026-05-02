/**
 * Cron Job Authentication
 * Validates Vercel cron Authorization headers and legacy X-CRON-TOKEN headers.
 */

import { NextRequest } from 'next/server';

/**
 * Validate cron job request
 * Prefer Vercel's Authorization: Bearer $CRON_SECRET contract.
 * Keep X-CRON-TOKEN + CRON_TOKEN as a backwards-compatible fallback.
 */
export function validateCronToken(request: NextRequest): {
  valid: boolean;
  error?: string;
} {
  const expectedSecret = process.env.CRON_SECRET ?? process.env.CRON_TOKEN;

  if (!expectedSecret) {
    return {
      valid: false,
      error: 'Cron secret environment variable not configured',
    };
  }

  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];
  const legacyToken = request.headers.get('x-cron-token');
  const requestToken = bearerToken ?? legacyToken;

  if (!requestToken) {
    return {
      valid: false,
      error: 'Missing cron authorization token',
    };
  }

  if (requestToken !== expectedSecret) {
    return {
      valid: false,
      error: 'Invalid cron authorization token',
    };
  }

  return { valid: true };
}

/**
 * Wrapper to protect cron endpoints
 * Returns 401 if token is invalid
 */
export function withCronAuth(
  handler: (request: NextRequest) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    const validation = validateCronToken(request);

    if (!validation.valid) {
      console.warn('[CRON] Unauthorized access attempt:', validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return handler(request);
  };
}
