import type { Metadata, Viewport } from 'next'
import { inter, spaceGrotesk } from './fonts'
import { Analytics } from '@vercel/analytics/react'
import ClientLayout from '@/components/ClientLayout'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import GoogleAnalytics from '@/components/GoogleAnalytics'
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
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    apple: '/icon-192.svg',
  },
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
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#D45A00',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const messages = await getMessages();

  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <head>
        {/* PWA Meta Tags */}
        <link rel="manifest" href="/manifest.json" />

        {/* iOS PWA Support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="VexNexa" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />

        {/* Android PWA Support */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="VexNexa" />

        {/* Microsoft PWA Support */}
        <meta name="msapplication-TileColor" content="#D45A00" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* Theme Color */}
        <meta name="theme-color" content="#D45A00" />
        <meta name="msapplication-navbutton-color" content="#D45A00" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* Preload Service Worker */}
        <link rel="prefetch" href="/sw.js" />
      </head>
      <body className="min-h-screen font-sans antialiased bg-background text-foreground" suppressHydrationWarning>
        <GoogleAnalytics />
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