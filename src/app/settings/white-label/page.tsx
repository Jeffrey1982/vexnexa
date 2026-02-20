'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client-new';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Paintbrush, Upload, Globe, User, Loader2, RotateCcw, ExternalLink, Info, AlertTriangle } from 'lucide-react';
import DashboardNav from '@/components/dashboard/DashboardNav';
import DashboardFooter from '@/components/dashboard/DashboardFooter';

interface WhiteLabelSettings {
  id?: string;
  companyName?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  supportEmail?: string;
  website?: string;
  phone?: string;
  footerText?: string;
  showPoweredBy: boolean;
  customDomain?: string;
  subdomain?: string;
}

export default function WhiteLabelPage() {
  const [authUser, setAuthUser] = useState<any>(null);
  const [settings, setSettings] = useState<WhiteLabelSettings>({
    primaryColor: '#3B82F6',
    secondaryColor: '#1F2937',
    accentColor: '#10B981',
    showPoweredBy: true
  });
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState<{ logo: boolean; favicon: boolean }>({
    logo: false,
    favicon: false
  });

  const supabase = createClient();

  useEffect(() => {
    const getAuthUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setAuthUser(user);
    };
    getAuthUser();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/white-label');
      const data = await response.json();

      if (data.success) {
        setHasAccess(data.hasAccess);
        if (data.whiteLabel) {
          setSettings(data.whiteLabel);
        }
      } else {
        console.error('Failed to load settings:', data.error);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateSettings = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    if (settings.supportEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(settings.supportEmail)) errors.push('Invalid support email format');
    }
    if (settings.website) {
      try { new URL(settings.website); } catch { errors.push('Invalid website URL format (must include http:// or https://)'); }
    }
    if (settings.phone) {
      const phoneRegex = /^[\d\s\+\-\(\)]+$/;
      if (!phoneRegex.test(settings.phone)) errors.push('Invalid phone number format');
    }
    const colorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!colorRegex.test(settings.primaryColor)) errors.push('Invalid primary color format (must be hex: #RRGGBB)');
    if (!colorRegex.test(settings.secondaryColor)) errors.push('Invalid secondary color format (must be hex: #RRGGBB)');
    if (!colorRegex.test(settings.accentColor)) errors.push('Invalid accent color format (must be hex: #RRGGBB)');
    return { valid: errors.length === 0, errors };
  };

  const handleSave = async () => {
    const validation = validateSettings();
    if (!validation.valid) {
      alert('Please fix the following errors:\n\n' + validation.errors.join('\n'));
      return;
    }
    try {
      setIsSaving(true);
      const response = await fetch('/api/white-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await response.json();
      if (data.success) {
        setSettings(data.whiteLabel);
        alert('White label settings saved successfully!');
      } else {
        alert(data.code === 'UPGRADE_REQUIRED'
          ? 'White labeling is only available for Business plan users. Please upgrade your plan.'
          : (data.error || 'Failed to save settings'));
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('An error occurred while saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'favicon') => {
    try {
      setIsUploading(prev => ({ ...prev, [type]: true }));
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) { alert(`File too large. Maximum size is 2MB.`); return; }
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
      if (!validTypes.includes(file.type)) { alert('Invalid file type. Only JPEG, PNG, WebP, and SVG files are allowed.'); return; }
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      const response = await fetch('/api/white-label/upload', { method: 'POST', body: formData });
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        alert(response.status === 413 ? 'File too large for server.' : 'Upload failed.');
        return;
      }
      const data = await response.json();
      if (data.success) {
        setSettings(prev => ({ ...prev, [type === 'logo' ? 'logoUrl' : 'faviconUrl']: data.url }));
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all white label settings to default?')) {
      try {
        const response = await fetch('/api/white-label', { method: 'DELETE' });
        if (response.ok) {
          setSettings({ primaryColor: '#3B82F6', secondaryColor: '#1F2937', accentColor: '#10B981', showPoweredBy: true });
          alert('Settings reset to default');
        }
      } catch (error) {
        console.error('Reset error:', error);
        alert('Failed to reset settings');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <DashboardNav user={authUser} />
        <div className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-5xl mx-auto animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-48 bg-muted rounded-lg"></div>)}
            </div>
          </div>
        </div>
        <DashboardFooter />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <DashboardNav user={authUser} />
        <div className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-lg mx-auto text-center">
            <Card>
              <CardContent className="pt-8 pb-8">
                <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-foreground mb-3">Upgrade Required</h1>
                <p className="text-muted-foreground mb-6">
                  White labeling is only available for Business plan users. Upgrade your plan to customize your brand.
                </p>
                <div className="flex gap-3 justify-center">
                  <Link href="/pricing">
                    <Button>View Pricing</Button>
                  </Link>
                  <Link href="/settings/billing">
                    <Button variant="outline">Billing Settings</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <DashboardFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardNav user={authUser} />
      <div className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              White Label Branding
            </h1>
            <p className="text-muted-foreground max-w-3xl">
              Customize your brand appearance and contact information. Make VexNexa truly yours with personalized branding.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Company Branding */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Paintbrush className="w-5 h-5" />
                    Company Branding
                  </CardTitle>
                  <CardDescription>Upload your logo and set your company name</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Company Name</Label>
                    <Input
                      value={settings.companyName || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, companyName: e.target.value }))}
                      placeholder="Enter your company name"
                      className="mt-2"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="mb-2 block">Company Logo <span className="text-xs text-muted-foreground ml-1">(Max 2MB)</span></Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors relative">
                        {settings.logoUrl ? (
                          <div className="space-y-3">
                            <Image src={settings.logoUrl} alt="Company Logo" width={64} height={64} className="h-16 w-16 object-contain mx-auto border rounded-lg" />
                            <p className="text-sm text-muted-foreground">Click to replace</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
                            <p className="text-sm text-muted-foreground">Upload your logo</p>
                          </div>
                        )}
                        <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file, 'logo'); }} disabled={isUploading.logo} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        {isUploading.logo && (
                          <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="mb-2 block">Favicon (16x16) <span className="text-xs text-muted-foreground ml-1">(Max 2MB)</span></Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors relative">
                        {settings.faviconUrl ? (
                          <div className="space-y-3">
                            <Image src={settings.faviconUrl} alt="Favicon" width={32} height={32} className="h-8 w-8 object-contain mx-auto border rounded" />
                            <p className="text-sm text-muted-foreground">Click to replace</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <Upload className="w-6 h-6 text-muted-foreground mx-auto" />
                            <p className="text-sm text-muted-foreground">Upload favicon</p>
                          </div>
                        )}
                        <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file, 'favicon'); }} disabled={isUploading.favicon} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        {isUploading.favicon && (
                          <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Brand Colors */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Paintbrush className="w-5 h-5" />
                    Brand Colors
                  </CardTitle>
                  <CardDescription>Define your brand&apos;s color palette</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {([
                      { key: 'primaryColor' as const, label: 'Primary Color', placeholder: '#3B82F6' },
                      { key: 'secondaryColor' as const, label: 'Secondary Color', placeholder: '#1F2937' },
                      { key: 'accentColor' as const, label: 'Accent Color', placeholder: '#10B981' },
                    ]).map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <Label className="mb-2 block">{label}</Label>
                        <input
                          type="color"
                          value={settings[key]}
                          onChange={(e) => setSettings(prev => ({ ...prev, [key]: e.target.value }))}
                          className="w-full h-10 border border-border rounded-md cursor-pointer"
                        />
                        <Input
                          value={settings[key]}
                          onChange={(e) => setSettings(prev => ({ ...prev, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className="mt-2"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Contact Information
                  </CardTitle>
                  <CardDescription>Set your support contact details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-2 block">Support Email</Label>
                      <Input type="email" value={settings.supportEmail || ''} onChange={(e) => setSettings(prev => ({ ...prev, supportEmail: e.target.value }))} placeholder="support@yourcompany.com" />
                    </div>
                    <div>
                      <Label className="mb-2 block">Website URL</Label>
                      <Input type="url" value={settings.website || ''} onChange={(e) => setSettings(prev => ({ ...prev, website: e.target.value }))} placeholder="https://yourcompany.com" />
                    </div>
                    <div>
                      <Label className="mb-2 block">Phone Number</Label>
                      <Input type="tel" value={settings.phone || ''} onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))} placeholder="+1 (555) 123-4567" />
                    </div>
                    <div>
                      <Label className="mb-2 block">Footer Text</Label>
                      <textarea
                        value={settings.footerText || ''}
                        onChange={(e) => setSettings(prev => ({ ...prev, footerText: e.target.value }))}
                        rows={3}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                        placeholder="Copyright 2025 Your Company. All rights reserved."
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <input id="showPoweredBy" type="checkbox" checked={settings.showPoweredBy} onChange={(e) => setSettings(prev => ({ ...prev, showPoweredBy: e.target.checked }))} className="h-4 w-4 rounded border-border" />
                    <Label htmlFor="showPoweredBy">Show &quot;Powered by VexNexa&quot; in footer</Label>
                  </div>
                </CardContent>
              </Card>

              {/* Domain Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Domain Settings
                  </CardTitle>
                  <CardDescription>Configure your custom domain and subdomain</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-2 block">Custom Domain</Label>
                      <Input value={settings.customDomain || ''} onChange={(e) => setSettings(prev => ({ ...prev, customDomain: e.target.value }))} placeholder="accessibility.yourcompany.com" />
                      <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                        <Info className="w-3 h-3" /> Contact support to set up custom domains
                      </p>
                    </div>
                    <div>
                      <Label className="mb-2 block">Subdomain</Label>
                      <Input value={settings.subdomain || ''} onChange={(e) => setSettings(prev => ({ ...prev, subdomain: e.target.value }))} placeholder="yourcompany" />
                      <p className="text-xs text-muted-foreground mt-1.5">Will be available at: yourcompany.vexnexa.com</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Live Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Live Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <div className="flex items-center space-x-3 mb-3">
                        {settings.logoUrl ? (
                          <Image src={settings.logoUrl} alt="Logo" width={32} height={32} className="h-8 w-8 object-contain" />
                        ) : (
                          <div className="w-8 h-8 bg-muted rounded"></div>
                        )}
                        <span className="font-semibold text-foreground">{settings.companyName || 'Your Company'}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="h-4 rounded" style={{ backgroundColor: settings.primaryColor }}></div>
                        <div className="h-4 rounded" style={{ backgroundColor: settings.secondaryColor }}></div>
                        <div className="h-4 rounded" style={{ backgroundColor: settings.accentColor }}></div>
                      </div>
                      <p className="text-xs text-muted-foreground">{settings.supportEmail || 'support@company.com'}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button onClick={handleSave} disabled={isSaving} className="w-full">
                      {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Settings'}
                    </Button>
                    <Button onClick={handleReset} variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10">
                      <RotateCcw className="w-4 h-4 mr-2" /> Reset to Default
                    </Button>
                  </CardContent>
                </Card>

                {/* Help */}
                <Alert>
                  <Info className="w-4 h-4" />
                  <AlertDescription>
                    Customize your VexNexa experience with white-label branding. <Link href="/contact" className="text-primary hover:underline font-medium">Contact Support <ExternalLink className="w-3 h-3 inline" /></Link>
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </div>
        </div>
      </div>
      <DashboardFooter />
    </div>
  );
}