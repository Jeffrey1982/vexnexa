import { Page, Scan } from "@prisma/client";

interface PageWithScan extends Page {
  scans: Scan[];
}

interface PagesTableProps {
  pages: PageWithScan[];
}

export default function PagesTable({ pages }: PagesTableProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-blue-400";
    if (score >= 70) return "text-gold-500";
    return "text-primary-500";
  };

  const getImpactColor = (count: number) => {
    if (count === 0) return "text-muted-foreground";
    if (count <= 2) return "text-gold-500";
    return "text-primary-500";
  };

  if (pages.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>No pages have been crawled yet.</p>
        <p className="text-sm mt-1">Start a crawl to discover pages on this site.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-muted">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Page
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Score
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Issues
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Critical
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Serious
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Moderate
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Minor
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Last Scan
            </th>
          </tr>
        </thead>
        <tbody className="bg-card divide-y divide-border">
          {pages.map((page) => (
            <tr key={page.id} className="hover:bg-muted/50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="max-w-xs">
                  <p className="text-sm font-medium text-foreground truncate">
                    {new URL(page.url).pathname}
                  </p>
                  <p className="text-xs text-muted-foreground truncate" title={page.url}>
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
                  <span className="text-muted-foreground">-</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {page.scans[0] ? (
                  <span className="text-sm font-medium text-foreground">
                    {page.scans[0].issues}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {page.scans[0] ? (
                  <span className={`text-sm font-medium ${getImpactColor(page.scans[0].impactCritical)}`}>
                    {page.scans[0].impactCritical}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {page.scans[0] ? (
                  <span className={`text-sm font-medium ${getImpactColor(page.scans[0].impactSerious)}`}>
                    {page.scans[0].impactSerious}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {page.scans[0] ? (
                  <span className={`text-sm font-medium ${getImpactColor(page.scans[0].impactModerate)}`}>
                    {page.scans[0].impactModerate}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {page.scans[0] ? (
                  <span className={`text-sm font-medium ${getImpactColor(page.scans[0].impactMinor)}`}>
                    {page.scans[0].impactMinor}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
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