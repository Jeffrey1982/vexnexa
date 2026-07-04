/**
 * Central brand configuration for VexNexa.
 * Change these values to rebrand the entire application.
 */

/** Width ÷ height of the square glyph tile (`vexnexa-mark.svg`, viewBox 100 × 100). */
export const BRAND_MARK_ASPECT = 1

export const BRAND = {
  name: "VexNexa",
  tagline: "Developer-friendly WCAG scanning",
  /** Square glyph tile (mark only) */
  logo: "/vexnexa-mark.svg",
  logoMark: "/vexnexa-mark.svg",
  /** Full mark + wordmark lockups, chosen by background */
  logoLockupLight: "/vexnexa-lockup.svg",
  logoLockupDark: "/vexnexa-lockup-dark.svg",
  icon: "/favicon.svg",
  logoPng: "/brand/vexnexa-lockup.png",
  iconPng192: "/android-chrome-192x192.png",
  iconPng512: "/android-chrome-512x512.png",
  /** Absolute URL for emails & JSON-LD (full lockup PNG — SVG isn't reliable there) */
  logoAbsolute: "https://vexnexa.com/brand/vexnexa-lockup.png",
  primaryColor: "#1F4A2D",
  themeColor: "#1F4A2D",
} as const;
