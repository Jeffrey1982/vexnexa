import type { Metadata } from 'next'
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { CookieBanner } from "@/components/marketing/CookieBanner";
import { SkipLink } from "@/components/marketing/SkipLink";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: {
    default: 'VexNexa - The secure gateway to web accessibility',
    template: '%s | VexNexa'
  },
  description: 'Automated scanning + 8 extra categories beyond traditional WCAG checks. Clear reports, quick fixes, continuous monitoring. Start your free scan today.',
  keywords: 'WCAG, accessibility, web accessibility, axe-core, accessibility testing, compliance, WCAG 2.1, accessibility scanner, a11y',
  authors: [{ name: 'Vexnexa' }],
  openGraph: {
    title: 'VexNexa - The secure gateway to web accessibility',
    description: 'Automated scanning + 8 extra categories beyond traditional WCAG checks. Clear reports, quick fixes, continuous monitoring.',
    url: 'https://vexnexa.com',
    siteName: 'VexNexa by Vexnexa',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VexNexa - The secure gateway to web accessibility',
    description: 'Automated scanning + 8 extra categories beyond traditional WCAG checks. Clear reports, quick fixes, continuous monitoring.',
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
    <div className="min-h-screen flex flex-col">
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