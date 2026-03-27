/**
 * Central brand configuration for VexNexa.
 * Change these values to rebrand the entire application.
 */

/** Width÷height of `vexnexa-logo-lockup-*.png` (update if you regenerate lockups). */
export const BRAND_LOGO_LOCKUP_ASPECT = 7131 / 1743

export const BRAND = {
  name: "VexNexa",
  tagline: "Developer-friendly WCAG scanning",
  /** @deprecated Prefer logoLockupLight/Dark — kept for older links */
  logo: "/brand/vexnexa-logo-lockup-light.png",
  logoLockupLight: "/brand/vexnexa-logo-lockup-light.png",
  logoLockupDark: "/brand/vexnexa-logo-lockup-dark.png",
  icon: "/brand/vexnexa-icon.svg",
  logoPng: "/brand/vexnexa-logo-lockup-light.png",
  iconPng192: "/brand/vexnexa-icon-192.png",
  iconPng512: "/brand/vexnexa-icon-512.png",
  /** Absolute URL for emails & light-background contexts */
  logoAbsolute: "https://vexnexa.com/brand/vexnexa-logo-lockup-light.png",
  primaryColor: "#14B8A6",
  themeColor: "#14B8A6",
} as const;
