import type { Metadata, Viewport } from 'next'
import { inter } from './fonts'
import { Analytics } from '@vercel/analytics/react'
import ClientLayout from '@/components/ClientLayout'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { NextIntlClientProvider } from 'next-intl'
import { cookies } from 'next/headers'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import './design-system.css'
import './globals.css'

const locales = ['en', 'nl', 'de', 'fr', 'es', 'pt'] as const
type Locale = (typeof locales)[number]

function isLocale(value: string | undefined): value is Locale {
  return locales.includes(value as Locale)
}

function mergeMessages(
  fallback: Record<string, unknown>,
  overrides: Record<string, unknown>
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...fallback }

  for (const [key, value] of Object.entries(overrides)) {
    const fallbackValue = fallback[key]
    if (
      value &&
      fallbackValue &&
      typeof value === 'object' &&
      typeof fallbackValue === 'object' &&
      !Array.isArray(value) &&
      !Array.isArray(fallbackValue)
    ) {
      merged[key] = mergeMessages(
        fallbackValue as Record<string, unknown>,
        value as Record<string, unknown>
      )
    } else {
      merged[key] = value
    }
  }

  return merged
}

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
  themeColor: '#3b82f6',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value
  const locale: Locale = isLocale(cookieLocale) ? cookieLocale : 'en'
  const fallbackMessages = (await import('../../messages/en.json')).default
  const localeMessages = (await import(`../../messages/${locale}.json`)).default
  const messages = mergeMessages(fallbackMessages, localeMessages)

  return (
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <head>
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
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* Theme Color */}
        <meta name="theme-color" content="#3b82f6" />
        <meta name="msapplication-navbutton-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* Preload Service Worker */}
        <link rel="prefetch" href="/sw.js" />
      </head>
      <body className="min-h-screen font-sans antialiased bg-background text-foreground" suppressHydrationWarning>
        <GoogleAnalytics />
        <NextIntlClientProvider locale={locale} messages={messages}>
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
