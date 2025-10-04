import { Inter, Plus_Jakarta_Sans, DM_Sans, Space_Grotesk, Urbanist } from 'next/font/google'

// Primary font pairing (recommended)
export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

// Alternative font options
export const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dmsans',
  display: 'swap',
  weight: ['400', '500', '700'],
})

export const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-spacegrotesk',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

export const urbanist = Urbanist({
  subsets: ['latin'],
  variable: '--font-urbanist',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

// Font pairing presets
export const fontPresets = {
  // Default: Inter + Plus Jakarta Sans (recommended)
  jakartaInter: \`\${inter.variable} \${jakarta.variable}\`,
  
  // Alternative pairings
  dmSansInter: \`\${inter.variable} \${dmSans.variable}\`,
  spaceGroteskInter: \`\${inter.variable} \${spaceGrotesk.variable}\`,
  urbanistInter: \`\${inter.variable} \${urbanist.variable}\`,
  interOnly: \`\${inter.variable}\`,
}
