/**
 * Cross-platform PDF open/download helper.
 *
 * Why inline open is required on iOS:
 * iOS Safari and iOS PWA (standalone) silently ignore `<a download>` clicks
 * and programmatic blob downloads. The only reliable method is to navigate
 * the current window to the PDF URL so the built-in PDF viewer takes over.
 * On desktop and Android the standard anchor-download pattern works fine.
 */

import { shouldUseInlinePdfOpen } from '@/lib/device'

export interface OpenPdfOptions {
  /** Direct URL to the PDF (preferred — avoids blob overhead). */
  url?: string
  /** PDF blob (used when the PDF was fetched via `fetch()` already). */
  blob?: Blob
  /** Suggested filename for the download (ignored on iOS inline open). */
  filename?: string
}

/**
 * Opens or downloads a PDF using the best strategy for the current platform.
 *
 * - **iOS / PWA**: navigates the current page to the PDF URL for inline viewing.
 * - **Other browsers**: opens in a new tab (URL) or triggers an anchor download (blob).
 *
 * Returns `true` if the open was attempted successfully.
 */
export function openPdf(options: OpenPdfOptions): boolean {
  const { url, blob, filename = 'report.pdf' } = options

  if (typeof window === 'undefined') return false
  if (!url && !blob) return false

  if (shouldUseInlinePdfOpen()) {
    return openPdfInline(url, blob)
  }

  return openPdfStandard(url, blob, filename)
}

// ---------------------------------------------------------------------------
// iOS / PWA — navigate to the PDF so the native viewer handles it
// ---------------------------------------------------------------------------

function openPdfInline(url: string | undefined, blob: Blob | undefined): boolean {
  if (url) {
    window.location.href = url
    return true
  }

  if (blob) {
    const objectUrl: string = URL.createObjectURL(blob)
    window.location.href = objectUrl
    // Don't revoke immediately — the browser needs time to start loading
    return true
  }

  return false
}

// ---------------------------------------------------------------------------
// Desktop / Android — new tab or anchor download
// ---------------------------------------------------------------------------

function openPdfStandard(
  url: string | undefined,
  blob: Blob | undefined,
  filename: string,
): boolean {
  if (url) {
    window.open(url, '_blank', 'noopener')
    return true
  }

  if (blob) {
    const objectUrl: string = URL.createObjectURL(blob)
    const anchor: HTMLAnchorElement = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = filename
    anchor.style.display = 'none'
    document.body.appendChild(anchor)
    anchor.click()

    // Clean up after a short delay so the browser can start the download
    setTimeout((): void => {
      document.body.removeChild(anchor)
      URL.revokeObjectURL(objectUrl)
    }, 250)

    return true
  }

  return false
}
