'use client';

import { createContext, useContext, useEffect, useState } from 'react';

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

interface WhiteLabelContextType {
  settings: WhiteLabelSettings | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const WhiteLabelContext = createContext<WhiteLabelContextType | undefined>(undefined);

export function useWhiteLabel() {
  const context = useContext(WhiteLabelContext);
  if (context === undefined) {
    throw new Error('useWhiteLabel must be used within a WhiteLabelProvider');
  }
  return context;
}

interface WhiteLabelProviderProps {
  children: React.ReactNode;
}

export function WhiteLabelProvider({ children }: WhiteLabelProviderProps) {
  const [settings, setSettings] = useState<WhiteLabelSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/white-label');
      
      if (!response.ok) {
        // If API call fails, set defaults and continue
        setSettings(null);
        setIsLoading(false);
        return;
      }
      
      const data = await response.json();

      if (data.success && data.whiteLabel && data.hasAccess) {
        setSettings(data.whiteLabel);
        
        // Apply dynamic CSS variables for theming
        if (typeof document !== 'undefined') {
          const root = document.documentElement;
          root.style.setProperty('--color-primary', data.whiteLabel.primaryColor);
          root.style.setProperty('--color-secondary', data.whiteLabel.secondaryColor);
          root.style.setProperty('--color-accent', data.whiteLabel.accentColor);

          // Only apply favicon and title changes on dashboard/app routes, not marketing pages
          const isMarketingPage = window.location.pathname === '/' ||
                                window.location.pathname.startsWith('/about') ||
                                window.location.pathname.startsWith('/contact') ||
                                window.location.pathname.startsWith('/features') ||
                                window.location.pathname.startsWith('/pricing') ||
                                window.location.pathname.startsWith('/legal') ||
                                window.location.pathname.startsWith('/test') ||
                                window.location.pathname.startsWith('/blog');

          if (!isMarketingPage) {
            // Update favicon if provided (only for dashboard/app pages)
            if (data.whiteLabel.faviconUrl) {
              const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
              if (favicon) {
                favicon.href = data.whiteLabel.faviconUrl;
              } else {
                const newFavicon = document.createElement('link');
                newFavicon.rel = 'icon';
                newFavicon.href = data.whiteLabel.faviconUrl;
                document.head.appendChild(newFavicon);
              }
            }

            // Update page title if company name is provided (only for dashboard/app pages)
            if (data.whiteLabel.companyName && !document.title.includes(data.whiteLabel.companyName)) {
              document.title = `${data.whiteLabel.companyName} - Accessibility Dashboard`;
            }
          }
        }
      } else {
        setSettings(null);
      }
    } catch (error) {
      console.error('Failed to load white label settings:', error);
      setSettings(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const refresh = async () => {
    setIsLoading(true);
    await loadSettings();
  };

  return (
    <WhiteLabelContext.Provider value={{ settings, isLoading, refresh }}>
      {children}
    </WhiteLabelContext.Provider>
  );
}