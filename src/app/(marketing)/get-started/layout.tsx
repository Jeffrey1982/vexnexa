import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Start an Accessibility Scan',
  description:
    'Start a VexNexa accessibility scan and continue into your dashboard workflow.',
  robots: {
    index: false,
    follow: true,
  },
}

export default function GetStartedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
