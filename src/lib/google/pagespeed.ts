/**
 * Google PageSpeed Insights API Client
 * Fetches Core Web Vitals for scoring (optional, feature-flagged)
 */

import axios from 'axios';

export interface PageSpeedMetrics {
  url: string;
  strategy: 'mobile' | 'desktop';
  performanceScore: number;
  lcp: number | null; // Largest Contentful Paint (ms)
  cls: number | null; // Cumulative Layout Shift
  inp: number | null; // Interaction to Next Paint (ms)
}

/**
 * Fetch PageSpeed Insights metrics for a URL
 * Requires PAGESPEED_API_KEY environment variable
 */
export async function fetchPageSpeedMetrics(
  url: string,
  strategy: 'mobile' | 'desktop' = 'mobile'
): Promise<PageSpeedMetrics> {
  const apiKey = process.env.PAGESPEED_API_KEY;

  if (!apiKey) {
    throw new Error('PAGESPEED_API_KEY environment variable not set');
  }

  try {
    const response = await axios.get(
      'https://www.googleapis.com/pagespeedonline/v5/runPagespeed',
      {
        params: {
          url,
          strategy,
          key: apiKey,
          category: 'performance',
        },
        timeout: 60000, // 60 second timeout
      }
    );

    const { lighthouseResult } = response.data;

    if (!lighthouseResult) {
      throw new Error('No Lighthouse result in PageSpeed response');
    }

    const performanceScore =
      (lighthouseResult.categories?.performance?.score || 0) * 100;

    // Extract Core Web Vitals
    const audits = lighthouseResult.audits || {};

    const lcp =
      audits['largest-contentful-paint']?.numericValue || null;
    const cls = audits['cumulative-layout-shift']?.numericValue || null;
    const inp = audits['interaction-to-next-paint']?.numericValue || null;

    return {
      url,
      strategy,
      performanceScore,
      lcp,
      cls,
      inp,
    };
  } catch (error) {
    console.error('Error fetching PageSpeed metrics:', error);
    throw new Error(
      `Failed to fetch PageSpeed metrics: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Check if PageSpeed Insights is enabled (API key present)
 */
export function isPageSpeedEnabled(): boolean {
  return !!process.env.PAGESPEED_API_KEY;
}

/**
 * Batch fetch PageSpeed metrics for multiple URLs
 * With rate limiting and error handling
 */
export async function batchFetchPageSpeedMetrics(
  urls: string[],
  strategy: 'mobile' | 'desktop' = 'mobile',
  delayMs: number = 2000
): Promise<PageSpeedMetrics[]> {
  const results: PageSpeedMetrics[] = [];

  for (const url of urls) {
    try {
      const metrics = await fetchPageSpeedMetrics(url, strategy);
      results.push(metrics);

      // Rate limiting delay
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(`Failed to fetch PageSpeed for ${url}:`, error);
      // Continue with other URLs even if one fails
    }
  }

  return results;
}
