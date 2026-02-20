/**
 * Device & PWA detection utilities.
 *
 * Why this exists:
 * iOS Safari (and especially iOS PWA / "Add to Home Screen" standalone mode)
 * silently ignores `<a download>` and programmatic blob downloads. The only
 * reliable way to show a PDF on iOS is to navigate the current page to the
 * PDF URL (inline open). Desktop and Android browsers handle the normal
 * anchor-download pattern fine.
 *
 * SSR-safe: every function guards against `typeof window === 'undefined'`.
 */

/**
 * Returns `true` when running on an iPhone, iPad, or iPod.
 * Covers both the classic `userAgent` string and the post-iPad-OS
 * `platform === 'MacIntel'` + touch-capable heuristic.
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false

  const ua: string = navigator.userAgent
  const isClassicIOS: boolean = /iPhone|iPad|iPod/.test(ua)

  // iPadOS 13+ reports as "Macintosh" in the UA but has touch support
  const isIPadOS: boolean =
    navigator.platform === 'MacIntel' &&
    typeof navigator.maxTouchPoints === 'number' &&
    navigator.maxTouchPoints > 1

  return isClassicIOS || isIPadOS
}

/**
 * Returns `true` when the page is running inside a standalone PWA
 * (i.e. "Add to Home Screen" on iOS, or installed PWA on Android/desktop).
 */
export function isStandalonePWA(): boolean {
  if (typeof window === 'undefined') return false

  // iOS Safari standalone mode
  const iosStandalone: boolean =
    'standalone' in window.navigator &&
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true

  // Standard display-mode media query (Android Chrome, desktop PWAs)
  const displayModeStandalone: boolean =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(display-mode: standalone)').matches

  return iosStandalone || displayModeStandalone
}

/**
 * Returns `true` when the platform cannot reliably handle `<a download>`
 * or blob-based downloads and should instead navigate directly to the
 * PDF URL for inline viewing.
 *
 * Currently: any iOS device OR any standalone PWA.
 */
export function shouldUseInlinePdfOpen(): boolean {
  return isIOS() || isStandalonePWA()
}
