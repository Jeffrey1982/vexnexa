"use client";

import { useEffect, useState } from 'react';

interface PWAStatus {
  isSupported: boolean;
  isInstalled: boolean;
  isRegistered: boolean;
  registration: ServiceWorkerRegistration | null;
  error: string | null;
}

export function usePWA() {
  const [status, setStatus] = useState<PWAStatus>({
    isSupported: false,
    isInstalled: false,
    isRegistered: false,
    registration: null,
    error: null,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const registerServiceWorker = async () => {
      try {
        // Check if service workers are supported
        if (!('serviceWorker' in navigator)) {
          setStatus(prev => ({
            ...prev,
            isSupported: false,
            error: 'Service Workers not supported',
          }));
          return;
        }

        setStatus(prev => ({ ...prev, isSupported: true }));

        // Check if app is installed
        const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                           (window.navigator as any).standalone;

        setStatus(prev => ({ ...prev, isInstalled }));

        // Register service worker
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        console.log('🔧 Service Worker registered successfully:', registration.scope);

        setStatus(prev => ({
          ...prev,
          isRegistered: true,
          registration,
        }));

        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            console.log('🔄 New service worker found, installing...');

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🔄 New service worker installed, prompting for reload...');

                // Notify user about update
                if (window.confirm('A new version is available. Reload to update?')) {
                  window.location.reload();
                }
              }
            });
          }
        });

        // Handle service worker activation
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return;
          refreshing = true;
          window.location.reload();
        });

      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
        setStatus(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Registration failed',
        }));
      }
    };

    registerServiceWorker();
  }, []);

  const updateServiceWorker = async () => {
    if (status.registration) {
      try {
        await status.registration.update();
        console.log('🔄 Service Worker update check completed');
      } catch (error) {
        console.error('❌ Service Worker update failed:', error);
      }
    }
  };

  const unregisterServiceWorker = async () => {
    if (status.registration) {
      try {
        const result = await status.registration.unregister();
        if (result) {
          console.log('🗑️ Service Worker unregistered successfully');
          setStatus(prev => ({
            ...prev,
            isRegistered: false,
            registration: null,
          }));
        }
      } catch (error) {
        console.error('❌ Service Worker unregistration failed:', error);
      }
    }
  };

  return {
    ...status,
    updateServiceWorker,
    unregisterServiceWorker,
  };
}

// Hook for offline status
export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateOnlineStatus = () => {
      const online = navigator.onLine;

      if (!online && isOnline) {
        setWasOffline(true);
      }

      setIsOnline(online);
    };

    // Set initial status
    updateOnlineStatus();

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [isOnline]);

  return { isOnline, wasOffline, isOffline: !isOnline };
}

// Hook for app installation
export function useAppInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already installed
    const checkInstalled = () => {
      const installed = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone;
      setIsInstalled(installed);
    };

    checkInstalled();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      setDeferredPrompt(null);
      setIsInstallable(false);

      return outcome === 'accepted';
    } catch (error) {
      console.error('❌ App installation failed:', error);
      return false;
    }
  };

  return {
    isInstallable,
    isInstalled,
    installApp,
    canInstall: isInstallable && !isInstalled,
  };
}

// Hook for push notifications
export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check support
    const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      return permission === 'granted';
    } catch (error) {
      console.error('❌ Notification permission request failed:', error);
      return false;
    }
  };

  const subscribeToPush = async (registration: ServiceWorkerRegistration): Promise<PushSubscription | null> => {
    if (!isSupported || permission !== 'granted') return null;

    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      setSubscription(subscription);
      return subscription;
    } catch (error) {
      console.error('❌ Push subscription failed:', error);
      return null;
    }
  };

  const unsubscribeFromPush = async (): Promise<boolean> => {
    if (!subscription) return false;

    try {
      const result = await subscription.unsubscribe();
      if (result) {
        setSubscription(null);
      }
      return result;
    } catch (error) {
      console.error('❌ Push unsubscription failed:', error);
      return false;
    }
  };

  return {
    isSupported,
    permission,
    subscription,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    canSubscribe: isSupported && permission === 'granted',
  };
}