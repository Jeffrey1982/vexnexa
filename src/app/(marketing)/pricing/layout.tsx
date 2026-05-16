import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing for WCAG Monitoring and Accessibility Reports',
  description:
    'Compare VexNexa plans for WCAG scanning, accessibility monitoring, PDF and DOCX reports, white-label exports, and team workflows.',
  openGraph: {
    title: 'VexNexa Pricing - WCAG Monitoring and Reports',
    description:
      'Transparent pricing for WCAG scanning, monitoring, report exports, and white-label accessibility workflows.',
    url: 'https://vexnexa.com/pricing',
    type: 'website',
  },
  alternates: {
    canonical: 'https://vexnexa.com/pricing',
  },
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
