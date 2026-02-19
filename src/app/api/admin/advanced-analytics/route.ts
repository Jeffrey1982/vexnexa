import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAPI } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getMollieRevenue } from '@/lib/billing/mollie-analytics';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAdminAPI();

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    const now = new Date();
    let startDate: Date;
    let endDate = now;

    // Calculate date range
    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get users in current and previous period
    const [currentPeriodUsers, previousPeriodUsers, allUsers] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime())),
            lt: startDate
          }
        }
      }),
      prisma.user.count()
    ]);

    // Get active users (users who have scanned in the period)
    const activeUsers = await prisma.user.count({
      where: {
        sites: {
          some: {
            scans: {
              some: {
                createdAt: {
                  gte: startDate,
                  lte: endDate
                }
              }
            }
          }
        }
      }
    });

    // Calculate metrics
    const userGrowth = previousPeriodUsers > 0
      ? ((currentPeriodUsers - previousPeriodUsers) / previousPeriodUsers) * 100
      : 100;

    // Fetch REAL revenue data from Mollie API
    const mollieData = await getMollieRevenue(startDate, endDate);
    const totalRevenue = mollieData.totalRevenue;
    const revenueGrowth = mollieData.revenueGrowth;
    const avgRevenuePerUser = allUsers > 0 ? totalRevenue / allUsers : 0;
    const lifetimeValue = avgRevenuePerUser * 12; // Assuming 12 month average lifetime

    // Calculate churn rate (users who haven't scanned in 60 days)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const churnedUsers = await prisma.user.count({
      where: {
        createdAt: { lt: sixtyDaysAgo },
        sites: {
          every: {
            scans: {
              every: {
                createdAt: { lt: sixtyDaysAgo }
              }
            }
          }
        }
      }
    });

    const totalEligibleForChurn = await prisma.user.count({
      where: {
        createdAt: { lt: sixtyDaysAgo }
      }
    });

    const churnRate = totalEligibleForChurn > 0
      ? (churnedUsers / totalEligibleForChurn) * 100
      : 0;

    // Cohort analysis - users by signup month
    const cohorts = [];
    for (let i = 5; i >= 0; i--) {
      const cohortStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const cohortEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const cohortUsers = await prisma.user.count({
        where: {
          createdAt: {
            gte: cohortStart,
            lte: cohortEnd
          }
        }
      });

      const retainedUsers = await prisma.user.count({
        where: {
          createdAt: {
            gte: cohortStart,
            lte: cohortEnd
          },
          sites: {
            some: {
              scans: {
                some: {
                  createdAt: {
                    gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
                  }
                }
              }
            }
          }
        }
      });

      const retentionRate = cohortUsers > 0 ? (retainedUsers / cohortUsers) * 100 : 0;

      // Calculate cohort revenue proportionally based on total revenue
      const cohortRevenue = allUsers > 0 ? (cohortUsers / allUsers) * totalRevenue : 0;

      cohorts.push({
        month: cohortStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        users: cohortUsers,
        retained: retainedUsers,
        retentionRate,
        revenue: cohortRevenue
      });
    }

    // Revenue forecast (simple linear projection based on growth)
    const forecast = [];
    const monthlyGrowth = userGrowth / 100;
    let projectedUsers = allUsers;
    let projectedRevenue = totalRevenue;

    for (let i = 1; i <= 6; i++) {
      projectedUsers = Math.round(projectedUsers * (1 + monthlyGrowth));
      projectedRevenue = projectedUsers * avgRevenuePerUser;

      const forecastDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const confidence = Math.max(50, 95 - (i * 7)); // Decreasing confidence over time

      forecast.push({
        month: forecastDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        predictedRevenue: Math.round(projectedRevenue),
        predictedUsers: projectedUsers,
        confidence
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        dateRange: {
          start: startDate,
          end: endDate
        },
        metrics: {
          totalRevenue,
          revenueGrowth,
          totalUsers: allUsers,
          userGrowth,
          activeUsers,
          churnRate,
          avgRevenuePerUser,
          lifetimeValue
        },
        cohorts,
        forecast
      }
    });

  } catch (error: any) {
    if (error?.message === "Authentication required" || error?.message === "Unauthorized: Admin access required") {
      return NextResponse.json({ success: false, error: error.message }, { status: error?.message === "Authentication required" ? 401 : 403 });
    }
    console.error('Advanced analytics error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
