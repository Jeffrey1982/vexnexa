import type { Metadata, Viewport } from 'next'
import { lexend } from './fonts'
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
      { url: '/brand/vexnexa-favicon-32.png', type: 'image/png', sizes: '32x32' },
      { url: '/brand/vexnexa-favicon-192.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: '/brand/vexnexa-favicon-192.png',
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
  themeColor: '#14B8A6',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const messages = await getMessages();

  return (
    <html lang="en" className={lexend.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700,1&display=swap"
          rel="stylesheet"
        />
        {/* Browser color-scheme hint — ensures form controls, scrollbars render in correct mode */}
        <meta name="color-scheme" content="light dark" />

        {/* Early theme script — apply class before first paint to prevent white flash.
            next-themes@0.4 injects its own script, but this ensures zero-delay coverage. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme:dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})()`,
          }}
        />

        {/* PWA Meta Tags */}
        <link rel="manifest" href="/manifest.json" />

        {/* iOS PWA Support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="VexNexa" />
        <link rel="apple-touch-icon" href="/brand/vexnexa-favicon-192.png" />

        {/* Android PWA Support */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="VexNexa" />

        {/* Microsoft PWA Support */}
        <meta name="msapplication-TileColor" content="#14B8A6" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* Theme Color */}
        <meta name="theme-color" content="#14B8A6" />
        <meta name="msapplication-navbutton-color" content="#14B8A6" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* Preload Service Worker */}
        <link rel="prefetch" href="/sw.js" />
      </head>
      <body className="min-h-screen font-sans antialiased bg-background text-foreground" suppressHydrationWarning>
        <GoogleAnalytics />
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
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