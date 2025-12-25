/**
 * Google API Authentication
 * Uses service account credentials for server-side API access
 */

import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

/**
 * Create JWT client for Google API authentication
 * Requires GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY env vars
 */
export function getGoogleAuthClient(scopes: string[]) {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error(
      'Missing Google credentials. Required: GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY'
    );
  }

  return new JWT({
    email: clientEmail,
    key: privateKey,
    scopes,
  });
}

/**
 * Get authenticated Google Search Console client
 */
export function getSearchConsoleClient() {
  const auth = getGoogleAuthClient([
    'https://www.googleapis.com/auth/webmasters.readonly',
  ]);

  return google.webmasters({ version: 'v3', auth });
}

/**
 * Get authenticated Google Analytics Data API client (GA4)
 */
export function getGA4Client() {
  const auth = getGoogleAuthClient([
    'https://www.googleapis.com/auth/analytics.readonly',
  ]);

  return google.analyticsdata({ version: 'v1beta', auth });
}

/**
 * Validate Google API credentials
 */
export async function validateGoogleCredentials(): Promise<{
  valid: boolean;
  error?: string;
}> {
  try {
    const auth = getGoogleAuthClient([
      'https://www.googleapis.com/auth/webmasters.readonly',
    ]);

    await auth.authorize();

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
