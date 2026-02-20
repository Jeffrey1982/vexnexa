'use client';

import { useState } from 'react';
import { Play, Loader2, CheckCircle, XCircle } from 'lucide-react';

export function TriggerSeoIngestion() {
  const [isTriggering, setIsTriggering] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTrigger = async () => {
    setIsTriggering(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/trigger-seo-ingestion', {
        method: 'POST',
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 dark:border-white/[0.06] rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-foreground">Manual Data Ingestion</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Trigger all SEO data ingestion cron jobs manually to populate your dashboard
          </p>
        </div>
        <button
          onClick={handleTrigger}
          disabled={isTriggering}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
            isTriggering
              ? 'bg-gray-100 text-muted-foreground cursor-not-allowed'
              : 'bg-[#e8570e] text-white hover:bg-[#b8450b]'
          }`}
        >
          {isTriggering ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Trigger Now
            </>
          )}
        </button>
      </div>

      {result && (
        <div className="mt-4">
          <div className={`flex items-center gap-2 p-3 rounded-md ${
            result.success
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            {result.success ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900">
                    Success! All SEO data has been ingested.
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Visit the <a href="/admin/seo" className="underline">SEO Health dashboard</a> to view your data.
                  </p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900">
                    Ingestion failed
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    {result.error || result.message || 'Unknown error'}
                  </p>
                </div>
              </>
            )}
          </div>

          {result.jobs && result.jobs.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-gray-900 dark:text-foreground">Job Results:</p>
              {result.jobs.map((job: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-white/[0.03] rounded text-xs"
                >
                  <span className="text-gray-900 dark:text-foreground">{job.name}</span>
                  <div className="flex items-center gap-2">
                    {job.status === 'success' ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        Success
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600">
                        <XCircle className="w-3 h-3" />
                        {job.status}
                      </span>
                    )}
                    <span className="text-muted-foreground">({job.statusCode || 'N/A'})</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 text-xs text-muted-foreground">
            <p>Triggered at: {new Date(result.timestamp).toLocaleString()}</p>
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-900">
          <strong>What this does:</strong>
        </p>
        <ul className="text-xs text-blue-800 mt-2 space-y-1 list-disc list-inside">
          <li>Fetches yesterday's Google Search Console data</li>
          <li>Fetches Google Analytics 4 landing page metrics</li>
          <li>Fetches PageSpeed Insights performance scores</li>
          <li>Calculates your SEO Health Score (0-1000)</li>
          <li>Detects issues and creates alerts</li>
        </ul>
        <p className="text-xs text-blue-700 mt-2">
          Processing takes 2-5 minutes. After completion, your dashboard will display real data.
        </p>
      </div>
    </div>
  );
}
