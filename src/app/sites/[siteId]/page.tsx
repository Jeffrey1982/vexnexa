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
          scans: {
            orderBy: { createdAt: "desc" },
            take: 1
          }
        },
        orderBy: { createdAt: "desc" }
      },
      scans: {
        orderBy: { createdAt: "desc" },
        take: 10
      }
    }
  });

  if (!site) {
    notFound();
  }

  const latestScan = site.scans[0];

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
        {latestScan && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Latest Crawl</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className={`font-medium ${
                  latestScan.status === 'done' ? 'text-green-600' :
                  latestScan.status === 'running' ? 'text-blue-600' :
                  latestScan.status === 'error' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  {latestScan.status}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Score</p>
                <p className="font-medium">{latestScan.score || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Issues</p>
                <p className="font-medium">{latestScan.issues || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="font-medium">
                  {new Date(latestScan.createdAt).toLocaleString()}
                </p>
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
                      .filter(p => p.scans.length > 0)
                      .reduce((sum, p) => sum + (p.scans[0]?.score || 0), 0) /
                    site.pages.filter(p => p.scans.length > 0).length
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
                .filter(p => p.scans.length > 0)
                .reduce((sum, p) => sum + (p.scans[0]?.impactCritical || 0), 0)
              }
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Total Issues
            </h3>
            <p className="text-3xl font-bold text-yellow-600">
              {site.pages
                .filter(p => p.scans.length > 0)
                .reduce((sum, p) => sum + (p.scans[0]?.issues || 0), 0)
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
        {site.scans.length > 0 && (
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
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Issues
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {site.scans.map((scan) => (
                    <tr key={scan.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(scan.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          scan.status === 'done' 
                            ? 'bg-green-100 text-green-800'
                            : scan.status === 'running'
                            ? 'bg-blue-100 text-blue-800'
                            : scan.status === 'error'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {scan.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {scan.score || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {scan.issues || 0}
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