'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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

  const supabase = createClientComponentClient();

  useEffect(() => {
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

    // Validate email format
    if (settings.supportEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(settings.supportEmail)) {
        errors.push('Invalid support email format');
      }
    }

    // Validate website URL
    if (settings.website) {
      try {
        new URL(settings.website);
      } catch {
        errors.push('Invalid website URL format (must include http:// or https://)');
      }
    }

    // Validate phone number format (basic)
    if (settings.phone) {
      const phoneRegex = /^[\d\s\+\-\(\)]+$/;
      if (!phoneRegex.test(settings.phone)) {
        errors.push('Invalid phone number format');
      }
    }

    // Validate color formats
    const colorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!colorRegex.test(settings.primaryColor)) {
      errors.push('Invalid primary color format (must be hex: #RRGGBB)');
    }
    if (!colorRegex.test(settings.secondaryColor)) {
      errors.push('Invalid secondary color format (must be hex: #RRGGBB)');
    }
    if (!colorRegex.test(settings.accentColor)) {
      errors.push('Invalid accent color format (must be hex: #RRGGBB)');
    }

    return { valid: errors.length === 0, errors };
  };

  const handleSave = async () => {
    // Validate before saving
    const validation = validateSettings();
    if (!validation.valid) {
      alert('Please fix the following errors:\n\n• ' + validation.errors.join('\n• '));
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch('/api/white-label', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      const data = await response.json();

      if (data.success) {
        setSettings(data.whiteLabel);
        alert('✓ White label settings saved successfully!');
      } else {
        if (data.code === 'UPGRADE_REQUIRED') {
          alert('⚠ White labeling is only available for Business plan users. Please upgrade your plan.');
        } else {
          alert('✗ ' + (data.error || 'Failed to save settings'));
        }
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('✗ An error occurred while saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'favicon') => {
    try {
      setIsUploading(prev => ({ ...prev, [type]: true }));

      // Validate file size on client side (max 2MB)
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        alert(`File too large. Maximum size is 2MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`);
        return;
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
      if (!validTypes.includes(file.type)) {
        alert('Invalid file type. Only JPEG, PNG, WebP, and SVG files are allowed.');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/white-label/upload', {
        method: 'POST',
        body: formData
      });

      // Handle non-JSON responses (like HTML error pages)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Server returned non-JSON response:', response.status);
        if (response.status === 413) {
          alert('File too large for server. The uploaded file exceeds the maximum allowed size. Please use a smaller image (max 2MB).');
        } else {
          alert('Upload failed. Server returned an unexpected response.');
        }
        return;
      }

      const data = await response.json();

      if (data.success) {
        setSettings(prev => ({
          ...prev,
          [type === 'logo' ? 'logoUrl' : 'faviconUrl']: data.url
        }));
        alert(`✓ ${type === 'logo' ? 'Logo' : 'Favicon'} uploaded successfully!`);
      } else {
        alert('✗ ' + (data.error || 'Upload failed'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('✗ Upload failed. Please try again with a smaller image.');
    } finally {
      setIsUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all white label settings to default?')) {
      try {
        const response = await fetch('/api/white-label', {
          method: 'DELETE'
        });

        if (response.ok) {
          setSettings({
            primaryColor: '#3B82F6',
            secondaryColor: '#1F2937',
            accentColor: '#10B981',
            showPoweredBy: true
          });
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
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <nav className="mb-6">
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm">
              ← Back to Dashboard
            </Link>
          </nav>

          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-yellow-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.598 0L4.216 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Upgrade Required</h1>
            <p className="text-gray-600 mb-6">
              White labeling is only available for Business plan users. Upgrade your plan to customize your brand.
            </p>
            <div className="space-x-4">
              <Link 
                href="/pricing" 
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                View Pricing
              </Link>
              <Link 
                href="/settings/billing" 
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Billing Settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Custom Header for Branding Page */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 transition-colors">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Dashboard
              </Link>
              <div className="h-4 w-px bg-gray-300"></div>
              <h1 className="text-lg font-semibold text-gray-900">Brand Settings</h1>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-500">Business Plan</div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
            White Label <span className="text-indigo-600">Branding</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            Customize your brand appearance and contact information. Make VexNexa truly yours with personalized branding.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Branding Section */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 lg:p-8 border border-white/20">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Company Branding</h2>
                  <p className="text-gray-600">Upload your logo and set your company name</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={settings.companyName || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, companyName: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50"
                    placeholder="Enter your company name"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Company Logo
                      <span className="text-xs font-normal text-gray-500 ml-2">(Max 2MB)</span>
                    </label>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-indigo-300 transition-colors relative">
                      {settings.logoUrl ? (
                        <div className="space-y-4">
                          <Image
                            src={settings.logoUrl}
                            alt="Company Logo"
                            width={64}
                            height={64}
                            className="h-16 w-16 object-contain mx-auto border rounded-lg shadow-sm"
                          />
                          <p className="text-sm text-gray-500">Click to replace</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-sm text-gray-500">Upload your logo</p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'logo');
                        }}
                        disabled={isUploading.logo}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      {isUploading.logo && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl">
                          <div className="text-indigo-600 flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Uploading...
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Favicon (16x16)
                      <span className="text-xs font-normal text-gray-500 ml-2">(Max 2MB)</span>
                    </label>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-indigo-300 transition-colors relative">
                      {settings.faviconUrl ? (
                        <div className="space-y-4">
                          <Image
                            src={settings.faviconUrl}
                            alt="Favicon"
                            width={32}
                            height={32}
                            className="h-8 w-8 object-contain mx-auto border rounded shadow-sm"
                          />
                          <p className="text-sm text-gray-500">Click to replace</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="w-8 h-8 bg-gray-100 rounded mx-auto flex items-center justify-center">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-sm text-gray-500">Upload favicon</p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'favicon');
                        }}
                        disabled={isUploading.favicon}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      {isUploading.favicon && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl">
                          <div className="text-indigo-600 flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Uploading...
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Colors Section */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 lg:p-8 border border-white/20">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Brand Colors</h2>
                  <p className="text-gray-600">Define your brand&apos;s color palette</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Primary Color
                  </label>
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="w-full h-12 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-indigo-300 transition-colors"
                      />
                    </div>
                    <input
                      type="text"
                      value={settings.primaryColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50"
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Secondary Color
                  </label>
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="color"
                        value={settings.secondaryColor}
                        onChange={(e) => setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                        className="w-full h-12 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-indigo-300 transition-colors"
                      />
                    </div>
                    <input
                      type="text"
                      value={settings.secondaryColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50"
                      placeholder="#1F2937"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Accent Color
                  </label>
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="color"
                        value={settings.accentColor}
                        onChange={(e) => setSettings(prev => ({ ...prev, accentColor: e.target.value }))}
                        className="w-full h-12 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-indigo-300 transition-colors"
                      />
                    </div>
                    <input
                      type="text"
                      value={settings.accentColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, accentColor: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50"
                      placeholder="#10B981"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 lg:p-8 border border-white/20">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Contact Information</h2>
                  <p className="text-gray-600">Set your support contact details</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Support Email
                  </label>
                  <input
                    type="email"
                    value={settings.supportEmail || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50"
                    placeholder="support@yourcompany.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={settings.website || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, website: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50"
                    placeholder="https://yourcompany.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={settings.phone || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Footer Text
                  </label>
                  <textarea
                    value={settings.footerText || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, footerText: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50 resize-none"
                    placeholder="Copyright © 2025 Your Company. All rights reserved."
                  />
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center">
                  <input
                    id="showPoweredBy"
                    type="checkbox"
                    checked={settings.showPoweredBy}
                    onChange={(e) => setSettings(prev => ({ ...prev, showPoweredBy: e.target.checked }))}
                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="showPoweredBy" className="ml-3 block text-sm font-medium text-gray-900">
                    Show &quot;Powered by VexNexa&quot; in footer
                  </label>
                </div>
              </div>
            </div>

            {/* Domain Settings */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 lg:p-8 border border-white/20">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Domain Settings</h2>
                  <p className="text-gray-600">Configure your custom domain and subdomain</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Custom Domain
                  </label>
                  <input
                    type="text"
                    value={settings.customDomain || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, customDomain: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50"
                    placeholder="accessibility.yourcompany.com"
                  />
                  <p className="text-xs text-gray-500 mt-2 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Contact support to set up custom domains
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Subdomain
                  </label>
                  <input
                    type="text"
                    value={settings.subdomain || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, subdomain: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50"
                    placeholder="yourcompany"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Will be available at: yourcompany.vexnexa.com
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Preview Card */}
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Live Preview</h3>
                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 rounded-lg bg-white/50">
                    <div className="flex items-center space-x-3 mb-2">
                      {settings.logoUrl ? (
                        <Image src={settings.logoUrl} alt="Logo" width={32} height={32} className="h-8 w-8 object-contain" />
                      ) : (
                        <div className="w-8 h-8 bg-gray-200 rounded"></div>
                      )}
                      <span className="font-semibold">{settings.companyName || 'Your Company'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="h-4 rounded" style={{ backgroundColor: settings.primaryColor }}></div>
                      <div className="h-4 rounded" style={{ backgroundColor: settings.secondaryColor }}></div>
                      <div className="h-4 rounded" style={{ backgroundColor: settings.accentColor }}></div>
                    </div>
                    <div className="text-xs text-gray-600">
                      {settings.supportEmail || 'support@company.com'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Card */}
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 font-semibold shadow-lg"
                  >
                    {isSaving ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </div>
                    ) : (
                      'Save Settings'
                    )}
                  </button>

                  <button
                    onClick={handleReset}
                    className="w-full px-6 py-3 text-red-600 border-2 border-red-200 rounded-xl hover:bg-red-50 hover:border-red-300 transition-all font-semibold"
                  >
                    Reset to Default
                  </button>
                </div>
              </div>

              {/* Help Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 border border-blue-200">
                <h3 className="text-lg font-bold text-blue-900 mb-2">Need Help?</h3>
                <p className="text-blue-700 text-sm mb-4">
                  Customize your VexNexa experience with white-label branding. Contact our support team for assistance.
                </p>
                <a
                  href="/contact"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold text-sm"
                >
                  Contact Support
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Footer for Branding Page */}
        <footer className="mt-16 bg-white/80 backdrop-blur-sm border-t border-gray-200/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-4 mb-4 md:mb-0">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">T</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">VexNexa</div>
                  <div className="text-xs text-gray-500">by Vexnexa</div>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                © 2025 VexNexa. White-label branding available on Business plans.
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}