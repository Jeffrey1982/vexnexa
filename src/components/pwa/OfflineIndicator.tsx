"use client";

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff, Wifi, CheckCircle } from 'lucide-react';
import { useOfflineStatus } from '@/hooks/usePWA';
import { cn } from '@/lib/utils';

export function OfflineIndicator() {
  const { isOnline, wasOffline } = useOfflineStatus();

  if (isOnline && !wasOffline) {
    return null; // Don't show anything if always online
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      {!isOnline ? (
        <Alert className="bg-red-50 border-red-200 text-red-800 shadow-lg">
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="font-medium">
            You're offline. Some features may be limited.
          </AlertDescription>
        </Alert>
      ) : wasOffline ? (
        <Alert className="bg-green-50 border-green-200 text-green-800 shadow-lg animate-in slide-in-from-top duration-300">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="font-medium">
            Back online! All features restored.
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}

export function NetworkStatus() {
  const { isOnline } = useOfflineStatus();

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4 text-green-500" />
          <span>Online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-red-500" />
          <span>Offline</span>
        </>
      )}
    </div>
  );
}