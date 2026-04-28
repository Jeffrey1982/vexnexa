/**
 * Centralized analytics event tracking for the marketing funnel.
 * Wraps Vercel Analytics (window.va) with typed event names.
 */

export type FunnelEvent =
  | 'homepage_cta_primary_click'
  | 'homepage_cta_demo_click'
  | 'homepage_cta_sample_report_click'
  | 'sample_report_view'
  | 'sample_report_cta_click'
  | 'free_scan_started'
  | 'signup_started'
  | 'signup_completed'
  | 'pricing_cta_click'
  | 'agencies_page_cta_click'
  | 'eaa_page_cta_click'
  | 'white_label_page_cta_click'
  | 'contact_cta_click'
  | 'features_cta_click'
  | 'wcag_scan_cta_click'
  | 'compliance_report_cta_click'
  | 'agency_offer_cta_click'
  | 'agency_contact_cta_click'
  | 'contact_reason_selected'
  | 'pilot_partner_apply_click'
  | 'pilot_partner_sample_report_click'
  | 'pilot_partner_contact_click'
  | 'pilot_banner_click'
  | 'hero_cta_click'
  | 'pricing_vat_toggle'
  | 'cta_click';

interface TrackOptions {
  location?: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Fire a funnel analytics event via Vercel Analytics.
 * Safe to call server-side (no-ops gracefully).
 */
export function trackEvent(event: FunnelEvent, options?: TrackOptions): void {
  try {
    if (typeof window === 'undefined') return;
    if (window.va && typeof window.va.track === 'function') {
      window.va.track(event, options ?? {});
    }
  } catch {
    // Analytics must never crash the UI
  }
}
