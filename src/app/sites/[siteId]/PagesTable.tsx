import { Page, Scan } from "@prisma/client";

interface PageWithScan extends Page {
  latestScan: Scan | null;
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
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Page
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Score
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Issues
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Critical
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Serious
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Moderate
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Minor
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Last Scan
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {pages.map((page) => (
            <tr key={page.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="max-w-xs">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {page.title || "Untitled"}
                  </p>
                  <p className="text-xs text-gray-500 truncate" title={page.url}>
                    {new URL(page.url).pathname}
                  </p>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {page.latestScan ? (
                  <span className={`text-lg font-bold ${getScoreColor(page.latestScan.score)}`}>
                    {page.latestScan.score}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {page.latestScan ? (
                  <span className="text-sm font-medium text-gray-900">
                    {page.latestScan.issues}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {page.latestScan ? (
                  <span className={`text-sm font-medium ${getImpactColor(page.latestScan.impactCritical)}`}>
                    {page.latestScan.impactCritical}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {page.latestScan ? (
                  <span className={`text-sm font-medium ${getImpactColor(page.latestScan.impactSerious)}`}>
                    {page.latestScan.impactSerious}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {page.latestScan ? (
                  <span className={`text-sm font-medium ${getImpactColor(page.latestScan.impactModerate)}`}>
                    {page.latestScan.impactModerate}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {page.latestScan ? (
                  <span className={`text-sm font-medium ${getImpactColor(page.latestScan.impactMinor)}`}>
                    {page.latestScan.impactMinor}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {page.latestScan 
                  ? new Date(page.latestScan.createdAt).toLocaleDateString()
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