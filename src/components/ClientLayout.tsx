'use client';

import { WhiteLabelProvider } from '@/lib/white-label/context';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <WhiteLabelProvider>
      {children}
    </WhiteLabelProvider>
  );
}