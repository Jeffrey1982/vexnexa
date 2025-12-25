/**
 * Google Analytics 4 Data API Client
 * Fetches GA4 landing page metrics for scoring
 */

import { getGA4Client } from './auth';

export interface GA4LandingPageMetrics {
  landingPage: string;
  organicSessions: number;
  engagedSessions: number;
  engagementRate: number;
  avgEngagementTimeSeconds: number;
  totalUsers: number;
  returningUsers: number;
  eventsPerSession: number;
  conversions: Record<string, number>;
}

/**
 * Fetch GA4 landing page metrics for organic traffic
 */
export async function fetchGA4LandingPageMetrics(
  propertyId: string,
  startDate: string,
  endDate: string,
  limit: number = 500
): Promise<GA4LandingPageMetrics[]> {
  const client = getGA4Client();

  try {
    const response = await client.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'landingPage' }],
        metrics: [
          { name: 'sessions' },
          { name: 'engagedSessions' },
          { name: 'engagementRate' },
          { name: 'userEngagementDuration' },
          { name: 'totalUsers' },
          { name: 'newUsers' },
          { name: 'eventsPerSession' },
          { name: 'conversions' },
        ],
        dimensionFilter: {
          filter: {
            fieldName: 'sessionDefaultChannelGroup',
            stringFilter: {
              matchType: 'EXACT',
              value: 'Organic Search',
            },
          },
        },
        limit,
        orderBys: [
          {
            metric: { metricName: 'sessions' },
            desc: true,
          },
        ],
      },
    });

    if (!response.data.rows) {
      return [];
    }

    return response.data.rows.map((row) => {
      const landingPage = row.dimensionValues?.[0]?.value || '';
      const metrics = row.metricValues || [];

      const sessions = parseInt(metrics[0]?.value || '0');
      const engagedSessions = parseInt(metrics[1]?.value || '0');
      const engagementRate = parseFloat(metrics[2]?.value || '0');
      const userEngagementDuration = parseFloat(metrics[3]?.value || '0');
      const totalUsers = parseInt(metrics[4]?.value || '0');
      const newUsers = parseInt(metrics[5]?.value || '0');
      const eventsPerSession = parseFloat(metrics[6]?.value || '0');
      const conversions = parseFloat(metrics[7]?.value || '0');

      const returningUsers = Math.max(0, totalUsers - newUsers);
      const avgEngagementTimeSeconds =
        sessions > 0 ? userEngagementDuration / sessions : 0;

      return {
        landingPage,
        organicSessions: sessions,
        engagedSessions,
        engagementRate,
        avgEngagementTimeSeconds,
        totalUsers,
        returningUsers,
        eventsPerSession,
        conversions: { total: conversions },
      };
    });
  } catch (error) {
    console.error('Error fetching GA4 landing page metrics:', error);
    throw new Error(
      `Failed to fetch GA4 landing page metrics: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Fetch GA4 site-level conversion metrics
 */
export async function fetchGA4ConversionMetrics(
  propertyId: string,
  startDate: string,
  endDate: string
): Promise<{
  sessions: number;
  conversions: number;
  conversionRate: number;
}> {
  const client = getGA4Client();

  try {
    const response = await client.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: 'sessions' },
          { name: 'conversions' },
        ],
        dimensionFilter: {
          filter: {
            fieldName: 'sessionDefaultChannelGroup',
            stringFilter: {
              matchType: 'EXACT',
              value: 'Organic Search',
            },
          },
        },
      },
    });

    const row = response.data.rows?.[0];
    if (!row) {
      return { sessions: 0, conversions: 0, conversionRate: 0 };
    }

    const sessions = parseInt(row.metricValues?.[0]?.value || '0');
    const conversions = parseFloat(row.metricValues?.[1]?.value || '0');
    const conversionRate = sessions > 0 ? conversions / sessions : 0;

    return {
      sessions,
      conversions,
      conversionRate,
    };
  } catch (error) {
    console.error('Error fetching GA4 conversion metrics:', error);
    throw new Error(
      `Failed to fetch GA4 conversion metrics: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}
