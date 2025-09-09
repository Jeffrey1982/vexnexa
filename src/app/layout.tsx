import type { Metadata } from 'next'
import { fontSans, fontDisplay } from './fonts'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'

export const metadata: Metadata = {
  title: 'TutusPorta by Vexnexa',
  description: 'Professional accessibility scanning and reporting by Vexnexa',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${fontSans.variable} ${fontDisplay.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}