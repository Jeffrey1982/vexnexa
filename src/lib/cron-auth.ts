/**
 * Cron Job Authentication
 * Validates X-CRON-TOKEN header to secure cron endpoints
 */

import { NextRequest } from 'next/server';

/**
 * Validate cron job request
 * Checks X-CRON-TOKEN header against CRON_TOKEN env var
 */
export function validateCronToken(request: NextRequest): {
  valid: boolean;
  error?: string;
} {
  const cronToken = process.env.CRON_TOKEN;

  if (!cronToken) {
    return {
      valid: false,
      error: 'CRON_TOKEN environment variable not configured',
    };
  }

  const requestToken = request.headers.get('x-cron-token');

  if (!requestToken) {
    return {
      valid: false,
      error: 'Missing X-CRON-TOKEN header',
    };
  }

  if (requestToken !== cronToken) {
    return {
      valid: false,
      error: 'Invalid CRON_TOKEN',
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
