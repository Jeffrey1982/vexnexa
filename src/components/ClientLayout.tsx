'use client';

// TEMPORARILY DISABLED: WhiteLabelProvider causing auth loops
// import { WhiteLabelProvider } from '@/lib/white-label/context';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <>
      {children}
    </>
  );
}