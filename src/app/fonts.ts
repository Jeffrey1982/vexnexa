import { Lexend } from 'next/font/google'

/** Body / UI — Lexend (variable) for exceptional readability */
export const lexend = Lexend({
  subsets: ['latin'],
  variable: '--font-lexend',
  display: 'swap',
})

/** @deprecated Use `lexend` — same instance for layout compatibility */
export const inter = lexend

/** @deprecated Headings use Satoshi via Fontshare in layout */
export const spaceGrotesk = lexend
