"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, Download, Smartphone, Monitor, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return;
      }

      // Check for iOS PWA
      if ((window.navigator as any).standalone) {
        setIsInstalled(true);
        return;
      }
    };

    // Check if iOS device
    const checkIfIOS = () => {
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      setIsIOS(isIOSDevice);
    };

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show install prompt after a delay
      setTimeout(() => {
        setIsVisible(true);
      }, 3000);
    };

    // Listen for app installation
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    checkIfInstalled();
    checkIfIOS();

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
    } catch (error) {
      console.error('Install prompt failed:', error);
    } finally {
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Store dismissal in localStorage to avoid showing again too soon
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't show if already installed or recently dismissed
  const recentlyDismissed = () => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (!dismissed) return false;

    const dismissedTime = parseInt(dismissed);
    const dayInMs = 24 * 60 * 60 * 1000;
    return Date.now() - dismissedTime < dayInMs * 7; // Don't show for 7 days
  };

  if (isInstalled || !isVisible || recentlyDismissed()) {
    return null;
  }

  // iOS installation instructions
  if (isIOS && !deferredPrompt) {
    return (
      <Alert className="fixed bottom-4 left-4 right-4 z-50 bg-blue-50 border-blue-200 max-w-md mx-auto">
        <Smartphone className="h-4 w-4 text-blue-600" />
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <AlertDescription className="text-blue-800">
              <strong>Install TutuSporta</strong><br />
              Tap <span className="inline-flex items-center mx-1">📤</span> in Safari, then "Add to Home Screen"
            </AlertDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-blue-600 hover:bg-blue-100 -mt-1"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Alert>
    );
  }

  // Standard PWA install prompt
  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 shadow-lg max-w-md mx-auto border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Download className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-blue-900">
                Install TutuSporta
              </CardTitle>
              <CardDescription className="text-blue-700 text-sm">
                Get the full app experience
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-blue-600 hover:bg-blue-100 -mt-1"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-2 mb-4 text-xs text-blue-700">
          <div className="flex flex-col items-center gap-1">
            <Zap className="h-4 w-4" />
            <span>Faster</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Monitor className="h-4 w-4" />
            <span>Offline</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Smartphone className="h-4 w-4" />
            <span>Native Feel</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleInstallClick}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Install App
          </Button>
          <Button
            variant="outline"
            onClick={handleDismiss}
            size="sm"
            className="border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            Not Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Hook for PWA status
export function usePWAStatus() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const checkPWAStatus = () => {
      // Check if running in standalone mode
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');
      setIsStandalone(standalone);

      // Check if app is installed
      setIsInstalled(standalone);
    };

    const handleBeforeInstallPrompt = () => {
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
    };

    checkPWAStatus();
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  return { isInstalled, isInstallable, isStandalone };
}