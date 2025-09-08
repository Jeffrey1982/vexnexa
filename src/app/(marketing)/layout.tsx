import type { Metadata } from 'next'
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { CookieBanner } from "@/components/marketing/CookieBanner";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: {
    default: 'TutusPorta - WCAG-scans die wél inzicht geven',
    template: '%s | TutusPorta'
  },
  description: 'Voer een URL in en krijg een concreet rapport met prioriteiten, voorbeelden en quick wins. Export als PDF of Word.',
  keywords: 'WCAG, accessibility, web toegankelijkheid, axe-core, accessibility testing, compliance',
  openGraph: {
    title: 'TutusPorta - WCAG-scans die wél inzicht geven',
    description: 'Voer een URL in en krijg een concreet rapport met prioriteiten, voorbeelden en quick wins. Export als PDF of Word.',
    url: 'https://tutusporta.com',
    siteName: 'TutusPorta',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TutusPorta - WCAG-scans die wél inzicht geven',
    description: 'Voer een URL in en krijg een concreet rapport met prioriteiten, voorbeelden en quick wins. Export als PDF of Word.',
  },
  alternates: {
    canonical: 'https://tutusporta.com',
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <CookieBanner />
      <Toaster />
    </div>
  );
}