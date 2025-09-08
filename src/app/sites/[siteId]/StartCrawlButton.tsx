'use client';

import { useState } from 'react';

interface StartCrawlButtonProps {
  siteId: string;
}

export default function StartCrawlButton({ siteId }: StartCrawlButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [maxPages, setMaxPages] = useState(50);
  const [maxDepth, setMaxDepth] = useState(3);

  const handleStartCrawl = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId,
          maxPages,
          maxDepth,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start crawl');
      }

      // Refresh the page to show the new crawl status
      window.location.reload();
    } catch (error) {
      console.error('Failed to start crawl:', error);
      alert(error instanceof Error ? error.message : 'Failed to start crawl');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      {!showOptions ? (
        <div className="flex gap-2">
          <button
            onClick={() => setShowOptions(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={isLoading}
          >
            Configure Crawl
          </button>
          <button
            onClick={handleStartCrawl}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading ? 'Starting...' : 'Quick Crawl'}
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-64">
          <h3 className="text-lg font-semibold mb-4">Crawl Options</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Pages
              </label>
              <input
                type="number"
                value={maxPages}
                onChange={(e) => setMaxPages(parseInt(e.target.value) || 50)}
                min="1"
                max="1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum number of pages to crawl (1-1000)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Depth
              </label>
              <input
                type="number"
                value={maxDepth}
                onChange={(e) => setMaxDepth(parseInt(e.target.value) || 3)}
                min="1"
                max="10"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                How deep to follow links (1-10)
              </p>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setShowOptions(false)}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={handleStartCrawl}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Starting...' : 'Start Crawl'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}