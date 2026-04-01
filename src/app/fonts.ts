import { Inter } from 'next/font/google'

/** Body + headings — Inter (variable) for clean, modern readability */
export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

/** @deprecated Use `inter` — kept for layout compatibility */
export const lexend = inter

/** @deprecated Use `inter` — kept for layout compatibility */
export const spaceGrotesk = inter
