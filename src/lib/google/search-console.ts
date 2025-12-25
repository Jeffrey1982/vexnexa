/**
 * Google Search Console API Client
 * Fetches search analytics data for scoring
 */

import { getSearchConsoleClient } from './auth';

export interface GSCMetrics {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCQueryData extends GSCMetrics {
  query: string;
}

export interface GSCPageData extends GSCMetrics {
  page: string;
}

/**
 * Fetch Search Console site-level metrics for a date range
 */
export async function fetchGSCSiteMetrics(
  siteUrl: string,
  startDate: string,
  endDate: string
): Promise<GSCMetrics> {
  const client = getSearchConsoleClient();

  try {
    const response = await client.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: [],
        rowLimit: 1,
      },
    });

    const row = response.data.rows?.[0];
    if (!row) {
      return { clicks: 0, impressions: 0, ctr: 0, position: 0 };
    }

    return {
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    };
  } catch (error) {
    console.error('Error fetching GSC site metrics:', error);
    throw new Error(
      `Failed to fetch GSC site metrics: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Fetch top queries for a date range
 */
export async function fetchGSCTopQueries(
  siteUrl: string,
  startDate: string,
  endDate: string,
  limit: number = 500
): Promise<GSCQueryData[]> {
  const client = getSearchConsoleClient();

  try {
    const response = await client.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: limit,
      },
    });

    if (!response.data.rows) {
      return [];
    }

    return response.data.rows.map((row) => ({
      query: row.keys?.[0] || '',
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    }));
  } catch (error) {
    console.error('Error fetching GSC top queries:', error);
    throw new Error(
      `Failed to fetch GSC top queries: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Fetch top pages for a date range
 */
export async function fetchGSCTopPages(
  siteUrl: string,
  startDate: string,
  endDate: string,
  limit: number = 500
): Promise<GSCPageData[]> {
  const client = getSearchConsoleClient();

  try {
    const response = await client.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['page'],
        rowLimit: limit,
      },
    });

    if (!response.data.rows) {
      return [];
    }

    return response.data.rows.map((row) => ({
      page: row.keys?.[0] || '',
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    }));
  } catch (error) {
    console.error('Error fetching GSC top pages:', error);
    throw new Error(
      `Failed to fetch GSC top pages: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Utility: Get date string in YYYY-MM-DD format
 */
export function getDateString(daysAgo: number = 0): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

/**
 * Utility: Get yesterday's date
 */
export function getYesterday(): string {
  return getDateString(1);
}
