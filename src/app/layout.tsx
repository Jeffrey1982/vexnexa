import type { Metadata } from 'next'
import { inter, spaceGrotesk } from './fonts'
import { Analytics } from '@vercel/analytics/react'
import ClientLayout from '@/components/ClientLayout'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import './design-system.css'
import './globals.css'

export const metadata: Metadata = {
  title: 'VexNexa - Accessibility Testing Platform',
  description: 'Professional accessibility testing and compliance monitoring platform for websites',
  keywords: ['accessibility', 'WCAG', 'testing', 'compliance', 'monitoring', 'a11y'],
  authors: [{ name: 'Vexnexa' }],
  creator: 'Vexnexa',
  publisher: 'Vexnexa',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'VexNexa',
  },
  openGraph: {
    title: 'VexNexa - Accessibility Testing Platform',
    description: 'Professional accessibility testing and compliance monitoring platform for websites',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
    title: 'VexNexa - Accessibility Testing Platform',
    description: 'Professional accessibility testing and compliance monitoring platform for websites',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: '#FF6B35',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const messages = await getMessages();

  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        {/* Default favicon - will be replaced by white label if configured */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />

        {/* PWA Meta Tags */}
        <link rel="manifest" href="/manifest.json" />

        {/* iOS PWA Support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="VexNexa" />
        <link rel="apple-touch-icon" href="/icon-192.png" />

        {/* Android PWA Support */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="VexNexa" />

        {/* Microsoft PWA Support */}
        <meta name="msapplication-TileColor" content="#FF6B35" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* Theme Color */}
        <meta name="theme-color" content="#FF6B35" />
        <meta name="msapplication-navbutton-color" content="#FF6B35" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* Preload Service Worker */}
        <link rel="prefetch" href="/sw.js" />
      </head>
      <body className="font-sans antialiased bg-[var(--tp-muted)]">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <ClientLayout>
              {children}
            </ClientLayout>
          </ThemeProvider>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  )
}