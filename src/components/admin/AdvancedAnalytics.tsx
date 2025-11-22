'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Activity,
  BarChart3
} from 'lucide-react';

interface AnalyticsData {
  dateRange: {
    start: Date;
    end: Date;
  };
  metrics: {
    totalRevenue: number;
    revenueGrowth: number;
    totalUsers: number;
    userGrowth: number;
    activeUsers: number;
    churnRate: number;
    avgRevenuePerUser: number;
    lifetimeValue: number;
  };
  cohorts: {
    month: string;
    users: number;
    retained: number;
    retentionRate: number;
    revenue: number;
  }[];
  forecast: {
    month: string;
    predictedRevenue: number;
    predictedUsers: number;
    confidence: number;
  }[];
}

interface AdvancedAnalyticsProps {
  data: AnalyticsData;
}

export function AdvancedAnalytics({ data }: AdvancedAnalyticsProps) {
  const [selectedRange, setSelectedRange] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/admin/export-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dateRange: selectedRange, format: 'pdf' })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${selectedRange}-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = () => {
    // Export cohort data as CSV
    const headers = ['Month', 'New Users', 'Retained', 'Retention Rate', 'Revenue'];
    const rows = data.cohorts.map(c => [
      c.month,
      c.users.toString(),
      c.retained.toString(),
      `${c.retentionRate.toFixed(1)}%`,
      `$${c.revenue.toFixed(2)}`
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cohort-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Date Range Selector & Export */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Advanced Analytics Dashboard</CardTitle>
              <CardDescription>Comprehensive insights with forecasting and cohort analysis</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 border rounded-lg p-1">
                <Button
                  variant={selectedRange === '7d' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedRange('7d')}
                >
                  7 Days
                </Button>
                <Button
                  variant={selectedRange === '30d' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedRange('30d')}
                >
                  30 Days
                </Button>
                <Button
                  variant={selectedRange === '90d' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedRange('90d')}
                >
                  90 Days
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={isExporting}
              >
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Revenue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${data.metrics.totalRevenue.toLocaleString()}
            </div>
            <div className={`flex items-center gap-1 text-sm mt-1 ${
              data.metrics.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {data.metrics.revenueGrowth >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {Math.abs(data.metrics.revenueGrowth).toFixed(1)}% vs last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {data.metrics.totalUsers.toLocaleString()}
            </div>
            <div className={`flex items-center gap-1 text-sm mt-1 ${
              data.metrics.userGrowth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {data.metrics.userGrowth >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {Math.abs(data.metrics.userGrowth).toFixed(1)}% vs last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Active Users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {data.metrics.activeUsers.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Churn Rate: {data.metrics.churnRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Avg Revenue per User
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${data.metrics.avgRevenuePerUser.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              LTV: ${data.metrics.lifetimeValue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cohort Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Cohort Retention Analysis</CardTitle>
          <CardDescription>Track user retention and revenue by signup month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left text-sm text-gray-600">
                  <th className="pb-3 font-medium">Cohort Month</th>
                  <th className="pb-3 font-medium">New Users</th>
                  <th className="pb-3 font-medium">Retained</th>
                  <th className="pb-3 font-medium">Retention Rate</th>
                  <th className="pb-3 font-medium">Revenue</th>
                  <th className="pb-3 font-medium">Health</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.cohorts.map((cohort) => (
                  <tr key={cohort.month} className="text-sm">
                    <td className="py-3 font-medium">{cohort.month}</td>
                    <td className="py-3">{cohort.users.toLocaleString()}</td>
                    <td className="py-3">{cohort.retained.toLocaleString()}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                          <div
                            className={`h-2 rounded-full ${
                              cohort.retentionRate >= 80 ? 'bg-green-600' :
                              cohort.retentionRate >= 60 ? 'bg-yellow-600' :
                              'bg-red-600'
                            }`}
                            style={{ width: `${cohort.retentionRate}%` }}
                          />
                        </div>
                        <span className="font-medium">{cohort.retentionRate.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="py-3 font-medium">${cohort.revenue.toLocaleString()}</td>
                    <td className="py-3">
                      {cohort.retentionRate >= 80 ? (
                        <Badge variant="outline" className="border-green-500 text-green-600">
                          Excellent
                        </Badge>
                      ) : cohort.retentionRate >= 60 ? (
                        <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                          Good
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-red-500 text-red-600">
                          Needs Attention
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Forecast */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Forecast (Next 6 Months)</CardTitle>
          <CardDescription>Predicted revenue based on historical trends and growth patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.forecast.map((item) => (
              <div key={item.month} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{item.month}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Confidence: {item.confidence.toFixed(0)}%
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Revenue</div>
                    <div className="text-lg font-bold text-gray-900">
                      ${item.predictedRevenue.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Users</div>
                    <div className="text-lg font-bold text-gray-900">
                      {item.predictedUsers.toLocaleString()}
                    </div>
                  </div>
                  <div className="w-24">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${item.confidence}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
