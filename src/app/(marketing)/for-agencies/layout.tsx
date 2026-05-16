import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'White-Label Accessibility Monitoring for Agencies',
  description:
    'Package WCAG scanning, continuous accessibility monitoring, regression alerts, and branded client reports as a recurring agency service.',
  openGraph: {
    title: 'White-Label Accessibility Monitoring for Agencies - VexNexa',
    description:
      'Turn accessibility into a recurring agency service with WCAG monitoring, branded reports, and client-ready evidence.',
    url: 'https://vexnexa.com/for-agencies',
    type: 'website',
  },
  alternates: {
    canonical: 'https://vexnexa.com/for-agencies',
  },
}

export default function ForAgenciesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
