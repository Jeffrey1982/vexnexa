import type { Metadata } from 'next'
import { spaceGrotesk, inter } from '@/lib/fonts'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import './globals.css'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: {
    default: 'VexNexa | Digital Acceleration for SMEs',
    template: '%s | VexNexa',
  },
  description: 'Build a smarter, faster, more resilient digital business. VexNexa helps you ship modern websites, automate operations, and integrate AI—without the chaos.',
  keywords: ['website development', 'automation', 'AI integration', 'accessibility', 'digital transformation'],
  authors: [{ name: 'VexNexa' }],
  creator: 'VexNexa',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://vexnexa.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'VexNexa',
    title: 'VexNexa | Digital Acceleration for SMEs',
    description: 'Build a smarter, faster, more resilient digital business.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'VexNexa',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VexNexa | Digital Acceleration for SMEs',
    description: 'Build a smarter, faster, more resilient digital business.',
    images: ['/og-image.jpg'],
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={cn(spaceGrotesk.variable, inter.variable)}>
      <body>
        <Header />
        <main id="main-content" className="pt-20">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
