'use client';

import { useEffect, useState } from 'react';
import { AdvancedAnalytics } from "@/components/admin/AdvancedAnalytics";
import { MollieQuickLinks } from "@/components/admin/MollieQuickLinks";

export default function AdvancedAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/admin/advanced-analytics?range=30d');
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive business intelligence with forecasting and cohort analysis
          </p>
        </div>

        {/* Mollie Quick Links */}
        <div className="mb-8">
          <MollieQuickLinks />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        ) : (
          <AdvancedAnalytics data={data} />
        )}
      </div>
    </div>
  );
}
