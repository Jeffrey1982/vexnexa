'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useWhiteLabel } from '@/lib/white-label/context';

interface BrandedFooterProps {
  className?: string;
}

export default function BrandedFooter({ className = '' }: BrandedFooterProps) {
  let settings = null;
  
  try {
    const whiteLabelContext = useWhiteLabel();
    settings = whiteLabelContext.settings;
  } catch (error) {
    // White label context not available, use defaults
    settings = null;
  }

  const currentYear = new Date().getFullYear();
  const companyName = settings?.companyName || 'TutusPorta';
  const footerText = settings?.footerText || `Copyright © ${currentYear} ${companyName}. All rights reserved.`;
  const showPoweredBy = settings?.showPoweredBy !== false; // Default to true
  const supportEmail = settings?.supportEmail;
  const website = settings?.website;
  const phone = settings?.phone;

  return (
    <footer 
      className={`bg-gray-50 border-t border-gray-200 ${className}`}
      style={{
        backgroundColor: settings?.secondaryColor ? `${settings.secondaryColor}08` : undefined
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              {settings?.logoUrl ? (
                <Image
                  src={settings.logoUrl}
                  alt={`${companyName} Logo`}
                  width={100}
                  height={24}
                  className="h-6 w-auto object-contain"
                />
              ) : (
                <div 
                  className="h-6 w-6 rounded flex items-center justify-center text-white font-bold text-xs"
                  style={{ 
                    backgroundColor: settings?.primaryColor || '#3B82F6' 
                  }}
                >
                  {companyName.charAt(0).toUpperCase()}
                </div>
              )}
              <span 
                className="text-lg font-semibold"
                style={{
                  color: settings?.secondaryColor || '#1F2937'
                }}
              >
                {companyName}
              </span>
            </div>
            <p 
              className="text-sm"
              style={{
                color: settings?.secondaryColor ? `${settings.secondaryColor}CC` : '#6B7280'
              }}
            >
              Accessibility testing and compliance platform
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 
              className="text-sm font-semibold uppercase tracking-wider mb-4"
              style={{
                color: settings?.secondaryColor || '#1F2937'
              }}
            >
              Quick Links
            </h3>
            <div className="space-y-2">
              <Link
                href="/dashboard"
                className="block text-sm transition-colors"
                style={{
                  color: settings?.secondaryColor ? `${settings.secondaryColor}CC` : '#6B7280'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = settings?.primaryColor || '#3B82F6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = settings?.secondaryColor ? `${settings.secondaryColor}CC` : '#6B7280';
                }}
              >
                Dashboard
              </Link>
              <Link
                href="/pricing"
                className="block text-sm transition-colors"
                style={{
                  color: settings?.secondaryColor ? `${settings.secondaryColor}CC` : '#6B7280'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = settings?.primaryColor || '#3B82F6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = settings?.secondaryColor ? `${settings.secondaryColor}CC` : '#6B7280';
                }}
              >
                Pricing
              </Link>
              <Link
                href="/features"
                className="block text-sm transition-colors"
                style={{
                  color: settings?.secondaryColor ? `${settings.secondaryColor}CC` : '#6B7280'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = settings?.primaryColor || '#3B82F6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = settings?.secondaryColor ? `${settings.secondaryColor}CC` : '#6B7280';
                }}
              >
                Features
              </Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h3 
              className="text-sm font-semibold uppercase tracking-wider mb-4"
              style={{
                color: settings?.secondaryColor || '#1F2937'
              }}
            >
              Legal
            </h3>
            <div className="space-y-2">
              <Link
                href="/legal/privacy"
                className="block text-sm transition-colors"
                style={{
                  color: settings?.secondaryColor ? `${settings.secondaryColor}CC` : '#6B7280'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = settings?.primaryColor || '#3B82F6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = settings?.secondaryColor ? `${settings.secondaryColor}CC` : '#6B7280';
                }}
              >
                Privacy Policy
              </Link>
              <Link
                href="/legal/terms"
                className="block text-sm transition-colors"
                style={{
                  color: settings?.secondaryColor ? `${settings.secondaryColor}CC` : '#6B7280'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = settings?.primaryColor || '#3B82F6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = settings?.secondaryColor ? `${settings.secondaryColor}CC` : '#6B7280';
                }}
              >
                Terms of Service
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 
              className="text-sm font-semibold uppercase tracking-wider mb-4"
              style={{
                color: settings?.secondaryColor || '#1F2937'
              }}
            >
              Contact
            </h3>
            <div className="space-y-2">
              {supportEmail && (
                <a
                  href={`mailto:${supportEmail}`}
                  className="block text-sm transition-colors"
                  style={{
                    color: settings?.secondaryColor ? `${settings.secondaryColor}CC` : '#6B7280'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = settings?.primaryColor || '#3B82F6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = settings?.secondaryColor ? `${settings.secondaryColor}CC` : '#6B7280';
                  }}
                >
                  {supportEmail}
                </a>
              )}
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="block text-sm transition-colors"
                  style={{
                    color: settings?.secondaryColor ? `${settings.secondaryColor}CC` : '#6B7280'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = settings?.primaryColor || '#3B82F6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = settings?.secondaryColor ? `${settings.secondaryColor}CC` : '#6B7280';
                  }}
                >
                  {phone}
                </a>
              )}
              {website && (
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm transition-colors"
                  style={{
                    color: settings?.secondaryColor ? `${settings.secondaryColor}CC` : '#6B7280'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = settings?.primaryColor || '#3B82F6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = settings?.secondaryColor ? `${settings.secondaryColor}CC` : '#6B7280';
                  }}
                >
                  Visit Website
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p 
              className="text-sm mb-4 md:mb-0"
              style={{
                color: settings?.secondaryColor ? `${settings.secondaryColor}CC` : '#6B7280'
              }}
            >
              {footerText}
            </p>
            
            {showPoweredBy && (
              <div className="flex items-center text-sm">
                <span 
                  className="mr-1"
                  style={{
                    color: settings?.secondaryColor ? `${settings.secondaryColor}CC` : '#6B7280'
                  }}
                >
                  Powered by
                </span>
                <Link
                  href="https://tutusporta.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold transition-colors"
                  style={{
                    color: settings?.primaryColor || '#3B82F6'
                  }}
                  onMouseEnter={(e) => {
                    const color = settings?.primaryColor || '#3B82F6';
                    e.currentTarget.style.color = darkenColor(color, 0.1);
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = settings?.primaryColor || '#3B82F6';
                  }}
                >
                  TutusPorta
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
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