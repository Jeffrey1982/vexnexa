import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy | VexNexa',
  description:
    'Read how VexNexa uses essential, functional, and analytics cookies across the accessibility monitoring platform.',
  alternates: {
    canonical: 'https://vexnexa.com/legal/cookies',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function CookiePolicyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
