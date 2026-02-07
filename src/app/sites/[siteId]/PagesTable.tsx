import { Page, Scan } from "@prisma/client";

interface PageWithScan extends Page {
  scans: Scan[];
}

interface PagesTableProps {
  pages: PageWithScan[];
}

export default function PagesTable({ pages }: PagesTableProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getImpactColor = (count: number) => {
    if (count === 0) return "text-gray-400";
    if (count <= 2) return "text-yellow-600";
    return "text-red-600";
  };

  if (pages.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>No pages have been crawled yet.</p>
        <p className="text-sm mt-1">Start a crawl to discover pages on this site.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-slate-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-200">
              Page
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-200">
              Score
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-200">
              Issues
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-200">
              Critical
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-200">
              Serious
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-200">
              Moderate
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-200">
              Minor
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-200">
              Last Scan
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-gray-700">
          {pages.map((page) => (
            <tr key={page.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="max-w-xs">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {new URL(page.url).pathname}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={page.url}>
                    {page.url}
                  </p>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {page.scans[0] ? (
                  <span className={`text-lg font-bold ${getScoreColor(page.scans[0].score || 0)}`}>
                    {page.scans[0].score || 'N/A'}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {page.scans[0] ? (
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {page.scans[0].issues}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {page.scans[0] ? (
                  <span className={`text-sm font-medium ${getImpactColor(page.scans[0].impactCritical)}`}>
                    {page.scans[0].impactCritical}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {page.scans[0] ? (
                  <span className={`text-sm font-medium ${getImpactColor(page.scans[0].impactSerious)}`}>
                    {page.scans[0].impactSerious}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {page.scans[0] ? (
                  <span className={`text-sm font-medium ${getImpactColor(page.scans[0].impactModerate)}`}>
                    {page.scans[0].impactModerate}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {page.scans[0] ? (
                  <span className={`text-sm font-medium ${getImpactColor(page.scans[0].impactMinor)}`}>
                    {page.scans[0].impactMinor}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {page.scans[0] 
                  ? new Date(page.scans[0].createdAt).toLocaleDateString()
                  : "Never"
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}