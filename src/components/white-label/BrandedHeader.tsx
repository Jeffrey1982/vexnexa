'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useWhiteLabel } from '@/lib/white-label/context';
import { createClient } from '@/lib/supabase/client-new';

interface BrandedHeaderProps {
  showNavigation?: boolean;
  className?: string;
}

export default function BrandedHeader({ showNavigation = true, className = '' }: BrandedHeaderProps) {
  let settings = null;
  let isLoading = true;

  try {
    const whiteLabelContext = useWhiteLabel();
    settings = whiteLabelContext.settings;
    isLoading = whiteLabelContext.isLoading;
  } catch (error) {
    // White label context not available, use defaults
    settings = null;
    isLoading = false;
  }

  const supabase = createClient();

  const companyName = settings?.companyName || 'VexNexa';
  const logoUrl = settings?.logoUrl;

  return (
    <header className={`bg-white dark:bg-slate-900 shadow-sm border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Company Name */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-3">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={`${companyName} Logo`}
                  width={120}
                  height={32}
                  className="h-8 w-auto max-w-[120px] object-contain"
                />
              ) : (
                <div 
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  style={{ 
                    backgroundColor: settings?.primaryColor || '#3B82F6' 
                  }}
                >
                  {companyName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xl font-bold text-foreground">
                {companyName}
              </span>
            </Link>
          </div>

          {/* Navigation */}
          {showNavigation && (
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
                style={{
                  color: settings?.secondaryColor || '#374151'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = settings?.primaryColor || '#3B82F6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = settings?.secondaryColor || '#374151';
                }}
              >
                Dashboard
              </Link>
              <Link
                href="/pricing"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
                style={{
                  color: settings?.secondaryColor || '#374151'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = settings?.primaryColor || '#3B82F6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = settings?.secondaryColor || '#374151';
                }}
              >
                Pricing
              </Link>
              <Link
                href="/settings/white-label"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
                style={{
                  color: settings?.secondaryColor || '#374151'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = settings?.primaryColor || '#3B82F6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = settings?.secondaryColor || '#374151';
                }}
              >
                Settings
              </Link>
            </nav>
          )}

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <Link
              href="/settings/billing"
              className="text-gray-700 hover:text-blue-600 text-sm font-medium transition-colors"
              style={{
                color: settings?.secondaryColor || '#374151'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = settings?.primaryColor || '#3B82F6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = settings?.secondaryColor || '#374151';
              }}
            >
              Account
            </Link>
            
            <button
              onClick={async () => {
                try {
                  // Clear client-side storage
                  if (typeof window !== 'undefined') {
                    localStorage.clear();
                    sessionStorage.clear();
                  }

                  // Sign out from Supabase client-side
                  await supabase.auth.signOut();

                  // Call server-side logout to clear all cookies
                  await fetch('/auth/logout', {
                    method: 'POST',
                    credentials: 'include'
                  });

                  // Force a hard redirect to clear all state
                  window.location.href = '/';
                } catch (error) {
                  console.error('Logout error:', error);
                  // Force redirect even on error
                  window.location.href = '/';
                }
              }}
              className="px-4 py-2 text-sm font-medium text-white rounded-md transition-colors"
              style={{
                backgroundColor: settings?.primaryColor || '#3B82F6'
              }}
              onMouseEnter={(e) => {
                const color = settings?.primaryColor || '#3B82F6';
                e.currentTarget.style.backgroundColor = darkenColor(color, 0.1);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = settings?.primaryColor || '#3B82F6';
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

// Helper function to darken a color
function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(255 * amount);
  const R = Math.max((num >> 16) - amt, 0);
  const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
  const B = Math.max((num & 0x0000FF) - amt, 0);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}