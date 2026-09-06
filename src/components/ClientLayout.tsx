'use client';

import { WhiteLabelProvider } from '@/lib/white-label/context';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';
import { SkipToContent } from '@/components/SkipToContent';
import { usePWA } from '@/hooks/usePWA';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { isApplicationPath } from '@/lib/application-path';

interface ClientLayoutProps {
  children: React.ReactNode;
}

function PWAManager({ enabled }: { enabled: boolean }) {
  const { isSupported, isRegistered, error } = usePWA(enabled);

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
  const applicationServicesEnabled = isApplicationPath(usePathname());

  return (
    <WhiteLabelProvider enabled={applicationServicesEnabled}>
      <SkipToContent />
      <PWAManager enabled={applicationServicesEnabled} />
      <OfflineIndicator />
      {children}
    </WhiteLabelProvider>
  );
}
