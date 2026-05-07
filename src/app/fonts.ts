import { Inter_Tight, JetBrains_Mono } from 'next/font/google'

/** Body text — Inter Tight: precise, narrow, modern sans */
export const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-inter-tight',
  display: 'swap',
})

/** Display + accents — JetBrains Mono: technical, distinctive, signals precision */
export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

/** @deprecated Use `interTight` — kept for layout compatibility */
export const outfit = interTight

/** @deprecated Use `interTight` — kept for layout compatibility */
export const inter = interTight

/** @deprecated Use `interTight` — kept for layout compatibility */
export const lexend = interTight

/** @deprecated Use `interTight` — kept for layout compatibility */
export const spaceGrotesk = interTight
