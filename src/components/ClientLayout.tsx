'use client';

import { WhiteLabelProvider } from '@/lib/white-label/context';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';
import { usePWA } from '@/hooks/usePWA';
import { useEffect } from 'react';

interface ClientLayoutProps {
  children: React.ReactNode;
}

function PWAManager() {
  const { isSupported, isRegistered, error } = usePWA();

  useEffect(() => {
    if (isSupported && isRegistered) {
      console.log('✅ PWA is ready!');
    } else if (error) {
      console.error('❌ PWA initialization failed:', error);
    }
  }, [isSupported, isRegistered, error]);

  return null;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <WhiteLabelProvider>
      <PWAManager />
      <OfflineIndicator />
      {children}
      <InstallPrompt />
    </WhiteLabelProvider>
  );
}