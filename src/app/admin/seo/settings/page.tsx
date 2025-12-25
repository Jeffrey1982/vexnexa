import {
  AdminPageShell,
  AdminPageHeader,
  AdminEmptyState,
} from "@/components/admin/layout";
import { Settings, Plug, BookOpen, Key } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: 'SEO Settings - VexNexa Admin',
  description: 'Configure Google Search Console integration',
};

export default async function AdminSeoSettingsPage() {
  // Check if Google integration is connected
  const isConnected = false; // TODO: Check actual connection status

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="SEO Settings"
        subtitle="Configure Google Search Console integration and SEO monitoring"
        icon={Settings}
      />

      {!isConnected ? (
        <div className="mt-6">
          <AdminEmptyState
            icon={Plug}
            title="Google Search Console not connected"
            description={
              <div className="space-y-2">
                <p>
                  Connect your Google account to enable SEO monitoring and analytics.
                  You'll need Google Search Console access for the domain you want to track.
                </p>
              </div>
            }
            actions={[
              {
                label: "Connect Google Account",
                variant: "default",
                icon: Plug,
                onClick: () => {
                  // TODO: Implement OAuth flow
                  console.log("Connect Google Account");
                },
              },
              {
                label: "Setup Instructions",
                variant: "outline",
                icon: BookOpen,
                href: "/docs/seo/setup",
              },
            ]}
            helpText={
              <div className="text-left space-y-2">
                <p className="font-medium">Requirements:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Google account with Search Console access</li>
                  <li>Verified property in Google Search Console</li>
                  <li>Read permissions for the property</li>
                </ul>
              </div>
            }
          />
        </div>
      ) : (
        <div className="space-y-6 mt-6">
          {/* Connected Account Card */}
          <Card>
            <CardHeader>
              <CardTitle>Connected Account</CardTitle>
              <CardDescription>
                Your Google Search Console integration is active
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Account Email</p>
                    <p className="text-sm text-gray-500">example@gmail.com</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Disconnect
                  </Button>
                </div>

                <div>
                  <p className="font-medium mb-2">Monitored Properties</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm">https://example.com</span>
                      <span className="text-xs text-gray-500">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Settings */}
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>
                Advanced settings for Google Search Console API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Sync Frequency</label>
                  <p className="text-sm text-gray-500">Every 24 hours</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Data Retention</label>
                  <p className="text-sm text-gray-500">90 days</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alert Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Alert Preferences</CardTitle>
              <CardDescription>
                Configure when and how you receive SEO alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Critical Issues</p>
                    <p className="text-xs text-gray-500">Immediate notification</p>
                  </div>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Index Coverage Warnings</p>
                    <p className="text-xs text-gray-500">Daily summary</p>
                  </div>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Performance Changes</p>
                    <p className="text-xs text-gray-500">Weekly report</p>
                  </div>
                  <input type="checkbox" className="rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AdminPageShell>
  );
}
