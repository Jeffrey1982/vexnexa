/**
 * Central brand configuration for VexNexa.
 * Change these values to rebrand the entire application.
 */

/** Width ÷ height of `vexnexa-v-mark.png` (tight-cropped to the glyph; update if asset changes). */
export const BRAND_MARK_ASPECT = 497 / 383

export const BRAND = {
  name: "VexNexa",
  tagline: "Developer-friendly WCAG scanning",
  /** Horizontal split: V mark + “VexNexa” wordmark in `VexnexaLogo` */
  logo: "/brand/vexnexa-v-mark.png",
  logoMark: "/brand/vexnexa-v-mark.png",
  /** @deprecated Full lockup PNGs — prefer split logo in UI */
  logoLockupLight: "/brand/vexnexa-logo-lockup-light.png",
  logoLockupDark: "/brand/vexnexa-logo-lockup-dark.png",
  icon: "/brand/vexnexa-favicon-32.png",
  logoPng: "/brand/vexnexa-v-mark.png",
  iconPng192: "/brand/vexnexa-favicon-192.png",
  iconPng512: "/brand/vexnexa-favicon-512.png",
  /** Absolute URL for emails & JSON-LD (V mark; wordmark added in HTML where needed) */
  logoAbsolute: "https://vexnexa.com/brand/vexnexa-v-mark.png",
  primaryColor: "#3b82f6",
  themeColor: "#3b82f6",
} as const;
