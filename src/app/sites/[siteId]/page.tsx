import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import StartCrawlButton from "./StartCrawlButton";
import PagesTable from "./PagesTable";

const prisma = new PrismaClient();

interface PageProps {
  params: {
    siteId: string;
  };
}

export default async function SitePage({ params }: PageProps) {
  const { siteId } = params;

  const site = await prisma.site.findUnique({
    where: { id: siteId },
    include: {
      pages: {
        include: {
          latestScan: true
        },
        orderBy: { createdAt: "desc" }
      },
      crawls: {
        orderBy: { startedAt: "desc" },
        take: 5
      }
    }
  });

  if (!site) {
    notFound();
  }

  const latestCrawl = site.crawls[0];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <nav className="mb-4">
            <Link
              href="/dashboard"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              ← Back to Dashboard
            </Link>
          </nav>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Site Details
              </h1>
              <p className="text-lg text-gray-600 mb-1">{site.url}</p>
              <p className="text-sm text-gray-500">
                {site.pages.length} pages discovered
              </p>
            </div>
            <StartCrawlButton siteId={siteId} />
          </div>
        </div>

        {/* Crawl Status */}
        {latestCrawl && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Latest Crawl</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className={`font-medium ${
                  latestCrawl.status === 'done' ? 'text-green-600' :
                  latestCrawl.status === 'running' ? 'text-blue-600' :
                  latestCrawl.status === 'error' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  {latestCrawl.status}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Pages Done</p>
                <p className="font-medium">{latestCrawl.pagesDone}/{latestCrawl.maxPages}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Started</p>
                <p className="font-medium">
                  {new Date(latestCrawl.startedAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Max Depth</p>
                <p className="font-medium">{latestCrawl.maxDepth}</p>
              </div>
            </div>
          </div>
        )}

        {/* Site Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Total Pages
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              {site.pages.length}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Average Score
            </h3>
            <p className="text-3xl font-bold text-green-600">
              {site.pages.length > 0 
                ? Math.round(
                    site.pages
                      .filter(p => p.latestScan)
                      .reduce((sum, p) => sum + (p.latestScan?.score || 0), 0) /
                    site.pages.filter(p => p.latestScan).length
                  ) || 0
                : 0
              }
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Critical Issues
            </h3>
            <p className="text-3xl font-bold text-red-600">
              {site.pages
                .filter(p => p.latestScan)
                .reduce((sum, p) => sum + (p.latestScan?.impactCritical || 0), 0)
              }
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Total Issues
            </h3>
            <p className="text-3xl font-bold text-yellow-600">
              {site.pages
                .filter(p => p.latestScan)
                .reduce((sum, p) => sum + (p.latestScan?.issues || 0), 0)
              }
            </p>
          </div>
        </div>

        {/* Pages Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Discovered Pages
            </h2>
          </div>
          <PagesTable pages={site.pages} />
        </div>

        {/* Recent Crawls */}
        {site.crawls.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Recent Crawls
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Started
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {site.crawls.map((crawl) => (
                    <tr key={crawl.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(crawl.startedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          crawl.status === 'done' 
                            ? 'bg-green-100 text-green-800'
                            : crawl.status === 'running'
                            ? 'bg-blue-100 text-blue-800'
                            : crawl.status === 'error'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {crawl.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {crawl.pagesDone}/{crawl.maxPages}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {crawl.finishedAt 
                          ? Math.round((new Date(crawl.finishedAt).getTime() - new Date(crawl.startedAt).getTime()) / 60000) + 'm'
                          : '-'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}