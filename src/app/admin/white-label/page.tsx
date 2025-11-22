import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette, Globe, ExternalLink, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export const dynamic = 'force-dynamic';
async function getWhiteLabelData() {
  const whiteLabels = await prisma.whiteLabel.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          plan: true,
          company: true
        }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  const stats = {
    totalConfigurations: whiteLabels.length,
    withCustomDomain: whiteLabels.filter(wl => wl.customDomain).length,
    withSubdomain: whiteLabels.filter(wl => wl.subdomain).length,
    withLogo: whiteLabels.filter(wl => wl.logoUrl).length,
    hidingPoweredBy: whiteLabels.filter(wl => !wl.showPoweredBy).length
  };

  return {
    whiteLabels,
    stats
  };
}

export default async function AdminWhiteLabelPage() {
  const { whiteLabels, stats } = await getWhiteLabelData();

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">White-Label Configuration</h1>
          <p className="text-gray-600 mt-2">Manage all customer white-label branding settings</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Configurations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-600" />
                <div className="text-3xl font-bold">{stats.totalConfigurations}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Custom Domains</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                <div className="text-3xl font-bold text-blue-600">{stats.withCustomDomain}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Subdomains</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-600" />
                <div className="text-3xl font-bold text-indigo-600">{stats.withSubdomain}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Custom Logos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div className="text-3xl font-bold text-green-600">{stats.withLogo}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Hiding Powered By</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-orange-600" />
                <div className="text-3xl font-bold text-orange-600">{stats.hidingPoweredBy}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* White-Label Configurations Table */}
        <Card>
          <CardHeader>
            <CardTitle>White-Label Configurations</CardTitle>
            <CardDescription>All customer branding customizations</CardDescription>
          </CardHeader>
          <CardContent>
            {whiteLabels.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Palette className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <div className="font-medium">No white-label configurations yet</div>
                <div className="text-sm">Customers will need Business plans to enable white-labeling</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left text-sm text-gray-600">
                      <th className="pb-3 font-medium">Company</th>
                      <th className="pb-3 font-medium">Owner</th>
                      <th className="pb-3 font-medium">Branding</th>
                      <th className="pb-3 font-medium">Colors</th>
                      <th className="pb-3 font-medium">Domain Settings</th>
                      <th className="pb-3 font-medium">Contact</th>
                      <th className="pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {whiteLabels.map((wl) => {
                      const userName = wl.user.firstName && wl.user.lastName
                        ? `${wl.user.firstName} ${wl.user.lastName}`
                        : wl.user.email;

                      return (
                        <tr key={wl.id} className="text-sm">
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              {wl.logoUrl ? (
                                <Image
                                  src={wl.logoUrl}
                                  alt={wl.companyName || 'Logo'}
                                  width={32}
                                  height={32}
                                  className="w-8 h-8 object-contain border rounded"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                                  <Palette className="w-4 h-4 text-gray-400" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-gray-900">
                                  {wl.companyName || 'Not Set'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Updated {new Date(wl.updatedAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            <div>
                              <div className="font-medium text-gray-900">{userName}</div>
                              <div className="text-xs text-gray-500">{wl.user.email}</div>
                              <Badge variant="outline" className="mt-1">{wl.user.plan}</Badge>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                {wl.logoUrl ? (
                                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                                ) : (
                                  <XCircle className="w-3 h-3 text-gray-400" />
                                )}
                                <span className="text-xs">Logo</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {wl.faviconUrl ? (
                                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                                ) : (
                                  <XCircle className="w-3 h-3 text-gray-400" />
                                )}
                                <span className="text-xs">Favicon</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="flex gap-1">
                              <div
                                className="w-6 h-6 rounded border border-gray-200"
                                style={{ backgroundColor: wl.primaryColor }}
                                title={`Primary: ${wl.primaryColor}`}
                              />
                              <div
                                className="w-6 h-6 rounded border border-gray-200"
                                style={{ backgroundColor: wl.secondaryColor }}
                                title={`Secondary: ${wl.secondaryColor}`}
                              />
                              <div
                                className="w-6 h-6 rounded border border-gray-200"
                                style={{ backgroundColor: wl.accentColor }}
                                title={`Accent: ${wl.accentColor}`}
                              />
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="space-y-1">
                              {wl.customDomain ? (
                                <div className="text-xs text-gray-900 flex items-center gap-1">
                                  <Globe className="w-3 h-3" />
                                  {wl.customDomain}
                                </div>
                              ) : null}
                              {wl.subdomain ? (
                                <div className="text-xs text-gray-600">
                                  {wl.subdomain}.vexnexa.com
                                </div>
                              ) : null}
                              {!wl.customDomain && !wl.subdomain && (
                                <span className="text-xs text-gray-400">No domain</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="space-y-1 max-w-xs">
                              {wl.supportEmail && (
                                <div className="text-xs text-gray-900 truncate">{wl.supportEmail}</div>
                              )}
                              {wl.website && (
                                <div className="text-xs text-gray-600 truncate">{wl.website}</div>
                              )}
                              {wl.phone && (
                                <div className="text-xs text-gray-600">{wl.phone}</div>
                              )}
                              <div className="flex items-center gap-1 pt-1">
                                {wl.showPoweredBy ? (
                                  <Badge variant="outline" className="text-xs">Shows Powered By</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">
                                    Hides Powered By
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <Link href={`/admin/users/${wl.user.id}`}>
                                <Button variant="outline" size="sm">
                                  View User
                                </Button>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
