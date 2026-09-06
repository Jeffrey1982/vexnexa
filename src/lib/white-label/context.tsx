'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

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
  enabled?: boolean;
}

export function WhiteLabelProvider({ children, enabled = true }: WhiteLabelProviderProps) {
  const [settings, setSettings] = useState<WhiteLabelSettings | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const requestRef = useRef<AbortController | null>(null);

  const loadSettings = useCallback(async () => {
    if (!enabled) return;
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setIsLoading(true);

    try {
      const response = await fetch('/api/white-label', { signal: controller.signal });
      if (controller.signal.aborted) return;
      
      if (!response.ok) {
        // If API call fails, set defaults and continue
        setSettings(null);
        return;
      }
      
      const data = await response.json();
      if (controller.signal.aborted) return;

      if (data.success && data.whiteLabel && data.hasAccess) {
        setSettings(data.whiteLabel);
      } else {
        setSettings(null);
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error('Failed to load white label settings:', error);
      setSettings(null);
    } finally {
      if (!controller.signal.aborted) setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      void loadSettings();
    } else {
      setSettings(null);
      setIsLoading(false);
    }

    return () => requestRef.current?.abort();
  }, [enabled, loadSettings]);

  useEffect(() => {
    if (!enabled || !settings) return;

    const root = document.documentElement;
    const colors = {
      '--color-primary': settings.primaryColor,
      '--color-secondary': settings.secondaryColor,
      '--color-accent': settings.accentColor,
    };
    const previousColors = Object.keys(colors).map((name) => [
      name, root.style.getPropertyValue(name), root.style.getPropertyPriority(name),
    ]);
    for (const [name, value] of Object.entries(colors)) root.style.setProperty(name, value);

    const existingFavicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    const favicon = existingFavicon ?? document.createElement('link');
    const previousFavicon = favicon.getAttribute('href');
    if (settings.faviconUrl) {
      favicon.rel = 'icon';
      favicon.setAttribute('href', settings.faviconUrl);
      if (!existingFavicon) document.head.appendChild(favicon);
    }

    const previousTitle = document.title;
    const brandedTitle = settings.companyName && !previousTitle.includes(settings.companyName)
      ? `${settings.companyName} - Accessibility Dashboard`
      : null;
    if (brandedTitle) document.title = brandedTitle;

    // The provider stays mounted on client navigation; undo only our own styling
    // so an agency's app theme never leaks onto the public marketing site.
    return () => {
      for (const [name, value, priority] of previousColors) {
        if (root.style.getPropertyValue(name) !== colors[name as keyof typeof colors]) continue;
        if (value) root.style.setProperty(name, value, priority);
        else root.style.removeProperty(name);
      }
      if (settings.faviconUrl && favicon.getAttribute('href') === settings.faviconUrl) {
        if (!existingFavicon) favicon.remove();
        else if (previousFavicon === null) favicon.removeAttribute('href');
        else favicon.setAttribute('href', previousFavicon);
      }
      if (brandedTitle && document.title === brandedTitle) document.title = previousTitle;
    };
  }, [enabled, settings]);

  return (
    <WhiteLabelContext.Provider value={{
      settings: enabled ? settings : null,
      isLoading: enabled && isLoading,
      refresh: loadSettings,
    }}>
      {children}
    </WhiteLabelContext.Provider>
  );
}
