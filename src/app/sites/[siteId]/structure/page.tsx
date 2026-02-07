import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SiteStructure3D } from "@/components/enhanced/SiteStructure3D";
import { getSiteStructureData } from "@/lib/site-structure-adapter";
import BrandedHeader from "@/components/white-label/BrandedHeader";
import BrandedFooter from "@/components/white-label/BrandedFooter";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Globe } from "lucide-react";

interface PageProps {
  params: Promise<{
    siteId: string;
  }>;
}

export default async function SiteStructurePage({ params }: PageProps) {
  const { siteId } = await params;
  let user;
  try {
    user = await requireAuth();
  } catch (error) {
    redirect("/auth/login");
  }

  // Verify site ownership
  const site = await prisma.site.findUnique({
    where: {
      id: siteId,
      userId: user.id
    },
    include: {
      pages: {
        include: {
          scans: {
            where: { status: 'done' },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      }
    }
  });

  if (!site) {
    notFound();
  }

  // Get site structure data from real scans
  const structureData = await getSiteStructureData(siteId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <BrandedHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/sites/${siteId}`}>
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Site
            </Button>
          </Link>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Globe className="h-4 w-4" />
            <span className="text-sm">{new URL(site.url).hostname}</span>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display tracking-tight mb-2">
            Site Structure Visualization
          </h1>
          <p className="text-lg text-muted-foreground">
            Interactive 3D view of your website&apos;s accessibility landscape and page hierarchy
          </p>
        </div>

        {!structureData ? (
          <div className="text-center py-16 bg-white dark:bg-card rounded-lg border shadow-sm">
            <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No scan data available</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Run an accessibility scan on this site first to generate the structure visualization.
            </p>
            <Link href={`/sites/${siteId}`}>
              <Button>
                Go to Site Dashboard
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* 3D Visualization */}
            <SiteStructure3D
              siteData={structureData}
              className="mb-8"
            />

            {/* Site Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-card p-6 rounded-lg shadow-sm border">
                <h3 className="font-semibold text-lg mb-2">Total Pages</h3>
                <div className="text-3xl font-bold text-blue-600">
                  {site.pages.length}
                </div>
                <p className="text-sm text-muted-foreground">
                  {site.pages.filter(p => p.scans.length > 0).length} scanned
                </p>
              </div>

              <div className="bg-white dark:bg-card p-6 rounded-lg shadow-sm border">
                <h3 className="font-semibold text-lg mb-2">Average Score</h3>
                <div className="text-3xl font-bold text-green-600">
                  {structureData.score}
                </div>
                <p className="text-sm text-muted-foreground">
                  Accessibility rating
                </p>
              </div>

              <div className="bg-white dark:bg-card p-6 rounded-lg shadow-sm border">
                <h3 className="font-semibold text-lg mb-2">Total Issues</h3>
                <div className="text-3xl font-bold text-orange-600">
                  {structureData.issues.critical + structureData.issues.serious +
                   structureData.issues.moderate + structureData.issues.minor}
                </div>
                <p className="text-sm text-muted-foreground">
                  Across all pages
                </p>
              </div>
            </div>

            {/* Issue Breakdown */}
            <div className="bg-white dark:bg-card p-6 rounded-lg shadow-sm border mb-8">
              <h3 className="font-semibold text-lg mb-4">Issue Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {structureData.issues.critical}
                  </div>
                  <div className="text-sm text-muted-foreground">Critical</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {structureData.issues.serious}
                  </div>
                  <div className="text-sm text-muted-foreground">Serious</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {structureData.issues.moderate}
                  </div>
                  <div className="text-sm text-muted-foreground">Moderate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {structureData.issues.minor}
                  </div>
                  <div className="text-sm text-muted-foreground">Minor</div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-500/10 p-6 rounded-lg border border-blue-200 dark:border-blue-500/30">
              <h3 className="font-semibold text-lg mb-3 text-blue-900 dark:text-blue-300">How to Use</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
                <div>
                  <h4 className="font-medium mb-2">Navigation Controls</h4>
                  <ul className="space-y-1">
                    <li>• Use zoom buttons to get closer/further view</li>
                    <li>• Toggle rotation for automatic spinning</li>
                    <li>• Switch between tree, network, and hierarchy views</li>
                    <li>• Reset button returns to default view</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Understanding the Visualization</h4>
                  <ul className="space-y-1">
                    <li>• Green nodes: High accessibility scores (80+)</li>
                    <li>• Yellow nodes: Moderate scores (60-79)</li>
                    <li>• Red nodes: Low scores (&lt;60)</li>
                    <li>• Numbers on nodes show total issue count</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <BrandedFooter />
    </div>
  );
}