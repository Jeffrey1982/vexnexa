import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { CookieBanner } from "@/components/marketing/CookieBanner";
import { Toaster } from "@/components/ui/toaster";
import {
  DEFAULT_MARKETING_LOCALE,
  buildAlternates,
  isMarketingLocale,
  localizedUrl,
  marketingStructuredData,
  ogLocale,
} from "@/lib/marketing-seo";

// Per-request metadata so canonical + hreflang reflect the active locale and
// path (set by the proxy via x-vn-locale / x-vn-path). Self-referencing
// canonical per language lets every locale URL be indexed independently.
export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const headerLocale = h.get('x-vn-locale');
  const locale = isMarketingLocale(headerLocale) ? headerLocale : DEFAULT_MARKETING_LOCALE;
  const path = h.get('x-vn-path') || '/';

  return {
    title: {
      default: 'VexNexa — White-Label WCAG Monitoring for Agencies & EU-Facing Teams',
      template: '%s | VexNexa',
    },
    description: 'Scan websites for WCAG 2.2 issues, catch accessibility regressions, and deliver branded reports. Continuous monitoring for agencies, compliance teams, and EU-facing businesses.',
    authors: [{ name: 'VexNexa' }],
    alternates: buildAlternates(path, locale),
    openGraph: {
      title: 'VexNexa — White-Label WCAG Monitoring for Agencies & EU-Facing Teams',
      description: 'Scan websites for WCAG 2.2 issues, catch regressions, and deliver branded reports. Built for agencies and EU-facing teams.',
      url: localizedUrl(locale, path),
      siteName: 'VexNexa',
      type: 'website',
      locale: ogLocale(locale),
      images: ['/opengraph-image'],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'VexNexa — White-Label WCAG Monitoring for Agencies & EU-Facing Teams',
      description: 'Scan websites for WCAG 2.2 issues, catch regressions, and deliver branded reports. Built for agencies and EU-facing teams.',
      creator: '@vexnexa',
      images: ['/opengraph-image'],
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
}

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h = await headers();
  const headerLocale = h.get('x-vn-locale');
  const locale = isMarketingLocale(headerLocale) ? headerLocale : DEFAULT_MARKETING_LOCALE;
  const path = h.get('x-vn-path') || '/';
  const structuredData = marketingStructuredData(path, locale);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
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
