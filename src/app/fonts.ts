import { Outfit } from 'next/font/google'

/** Body text — Outfit: clean, modern, excellent readability */
export const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

/** @deprecated Use `outfit` — kept for layout compatibility */
export const inter = outfit

/** @deprecated Use `outfit` — kept for layout compatibility */
export const lexend = outfit

/** @deprecated Use `outfit` — kept for layout compatibility */
export const spaceGrotesk = outfit
