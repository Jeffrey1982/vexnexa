import type { Metadata } from 'next'
import HomePageClient from './HomePageClient'

export const metadata: Metadata = {
  title: 'White-Label WCAG Monitoring for Agencies & EU Teams',
  description:
    'Scan websites for WCAG 2.2 issues, catch accessibility regressions, and deliver branded reports with continuous monitoring for agencies and EU-facing teams.',
  alternates: {
    canonical: 'https://vexnexa.com',
  },
  openGraph: {
    title: 'VexNexa - White-Label WCAG Monitoring for Agencies & EU Teams',
    description:
      'Continuous WCAG monitoring, accessibility regression alerts, and branded reports for agencies and EU-facing teams.',
    url: 'https://vexnexa.com',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VexNexa - White-Label WCAG Monitoring',
    description:
      'Continuous WCAG monitoring, accessibility regression alerts, and branded reports for agencies and EU-facing teams.',
  },
}

export default function MarketingHomePage() {
  return <HomePageClient />
}
