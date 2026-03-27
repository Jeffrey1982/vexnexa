import type { Metadata } from 'next'
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { CookieBanner } from "@/components/marketing/CookieBanner";
import { SkipLink } from "@/components/marketing/SkipLink";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: {
    default: 'VexNexa — White-Label WCAG Monitoring for Agencies & EU-Facing Teams',
    template: '%s | VexNexa'
  },
  description: 'Scan websites for WCAG 2.2 issues, catch accessibility regressions, and deliver branded reports. Continuous monitoring for agencies, compliance teams, and EU-facing businesses.',
  keywords: 'WCAG monitoring, accessibility scanner, white-label accessibility reports, EAA compliance, WCAG 2.2, agency accessibility tool, continuous monitoring, accessibility audit',
  authors: [{ name: 'VexNexa' }],
  openGraph: {
    title: 'VexNexa — White-Label WCAG Monitoring for Agencies & EU-Facing Teams',
    description: 'Scan websites for WCAG 2.2 issues, catch regressions, and deliver branded reports. Built for agencies and EU-facing teams.',
    url: 'https://vexnexa.com',
    siteName: 'VexNexa',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VexNexa — White-Label WCAG Monitoring for Agencies & EU-Facing Teams',
    description: 'Scan websites for WCAG 2.2 issues, catch regressions, and deliver branded reports. Built for agencies and EU-facing teams.',
    creator: '@vexnexa',
  },
  alternates: {
    canonical: 'https://vexnexa.com',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SkipLink />
      <Navbar />
      <main id="main-content" className="flex-1" tabIndex={-1}>
        {children}
      </main>
      <Footer />
      <CookieBanner />
      <Toaster />
    </div>
  );
}