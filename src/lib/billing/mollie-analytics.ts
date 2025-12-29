/**
 * Mollie Analytics Helper
 * Fetches real revenue data from Mollie API for admin analytics
 */

import { getMollieClient } from '@/lib/mollie';
import { Payment, Subscription } from '@mollie/api-client';

export interface MollieRevenueData {
  totalRevenue: number;
  periodRevenue: number;
  previousPeriodRevenue: number;
  revenueGrowth: number;
  payments: Payment[];
  activeSubscriptions: number;
}

/**
 * Fetch revenue data from Mollie for a given date range
 */
export async function getMollieRevenue(
  startDate: Date,
  endDate: Date
): Promise<MollieRevenueData> {
  try {
    const mollie = getMollieClient();

    // Calculate previous period dates for comparison
    const periodLength = endDate.getTime() - startDate.getTime();
    const previousStart = new Date(startDate.getTime() - periodLength);
    const previousEnd = startDate;

    // Fetch payments for current period
    const currentPaymentsPage = await mollie.payments.page({
      from: startDate.toISOString(),
      limit: 250 // Max per page
    });
    const currentPayments = currentPaymentsPage || [];

    // Fetch payments for previous period
    const previousPaymentsPage = await mollie.payments.page({
      from: previousStart.toISOString(),
      limit: 250
    });
    const previousPayments = previousPaymentsPage || [];

    // Calculate revenue from successful payments
    const calculateRevenue = (payments: Payment[]) => {
      return payments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => {
          const amount = p.amount?.value ? parseFloat(p.amount.value) : 0;
          return sum + amount;
        }, 0);
    };

    const periodRevenue = calculateRevenue(currentPayments);
    const previousPeriodRevenue = calculateRevenue(previousPayments);

    // Calculate growth
    const revenueGrowth = previousPeriodRevenue > 0
      ? ((periodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100
      : periodRevenue > 0 ? 100 : 0;

    // Get active subscriptions count
    const subscriptionsPage = await mollie.subscription.page({
      limit: 250
    });
    const subscriptions = subscriptionsPage || [];

    const activeSubscriptions = subscriptions.filter(
      s => s.status === 'active'
    ).length;

    // Fetch all-time payments for total revenue (limited to last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const allTimePaymentsPage = await mollie.payments.page({
      from: twelveMonthsAgo.toISOString(),
      limit: 250
    });
    const allTimePayments = allTimePaymentsPage || [];

    const totalRevenue = calculateRevenue(allTimePayments);

    return {
      totalRevenue,
      periodRevenue,
      previousPeriodRevenue,
      revenueGrowth,
      payments: currentPayments.filter(p => p.status === 'paid'),
      activeSubscriptions
    };

  } catch (error) {
    console.error('[Mollie Analytics] Error fetching revenue data:', error);

    // Return zeros if Mollie API fails (graceful degradation)
    return {
      totalRevenue: 0,
      periodRevenue: 0,
      previousPeriodRevenue: 0,
      revenueGrowth: 0,
      payments: [],
      activeSubscriptions: 0
    };
  }
}

/**
 * Get subscription revenue breakdown by plan
 */
export async function getSubscriptionBreakdown() {
  try {
    const mollie = getMollieClient();

    const subscriptionsPage = await mollie.subscription.page({
      limit: 250
    });
    const subscriptions = subscriptionsPage || [];

    const breakdown = subscriptions.reduce((acc, sub) => {
      if (sub.status === 'active' && sub.amount) {
        const amount = parseFloat(sub.amount.value);
        const description = sub.description || 'Unknown';

        if (!acc[description]) {
          acc[description] = {
            count: 0,
            monthlyRevenue: 0
          };
        }

        acc[description].count++;
        acc[description].monthlyRevenue += amount;
      }

      return acc;
    }, {} as Record<string, { count: number; monthlyRevenue: number }>);

    return breakdown;
  } catch (error) {
    console.error('[Mollie Analytics] Error fetching subscription breakdown:', error);
    return {};
  }
}

/**
 * Get Mollie dashboard URL for admin
 */
export function getMollieDashboardUrl(path = '') {
  // Mollie dashboard URLs
  const baseUrl = 'https://www.mollie.com/dashboard';

  const routes = {
    payments: `${baseUrl}/payments`,
    subscriptions: `${baseUrl}/subscriptions`,
    customers: `${baseUrl}/customers`,
    analytics: `${baseUrl}/analytics`,
    settings: `${baseUrl}/settings`
  };

  return routes[path as keyof typeof routes] || baseUrl;
}
