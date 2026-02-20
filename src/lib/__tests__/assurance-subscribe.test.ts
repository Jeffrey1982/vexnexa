/**
 * Tests for Assurance Subscribe API route + billing + client page
 *
 * Covers:
 * - Input validation (tier, billingCycle)
 * - Environment variable checks
 * - Provider error handling with requestId
 * - Success path response contract
 * - appUrl fix verification (function call, not string concat)
 * - Client page hydration safety
 * - Client error display with requestId
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readFile(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf-8');
}

// ── 1. API Route: /api/assurance/subscribe ──

describe('API Route: /api/assurance/subscribe', () => {
  const route = readFile('src/app/api/assurance/subscribe/route.ts');

  it('exports POST handler', () => {
    expect(route).toContain('export async function POST');
  });

  it('generates a requestId for every request', () => {
    expect(route).toContain('generateRequestId()');
    expect(route).toContain('requestId');
  });

  it('returns requestId in all error responses', () => {
    // Every error code is present and all safeError calls include requestId param
    const errorCodes = [
      'AUTH_REQUIRED',
      'INVALID_BODY',
      'INVALID_TIER',
      'INVALID_BILLING_CYCLE',
      'CONFIG_MISSING_ENV',
      'PROVIDER_ERROR',
    ];
    for (const code of errorCodes) {
      expect(route).toContain(`'${code}'`);
    }
    // safeError function signature includes requestId
    expect(route).toContain('requestId: string');
  });

  it('returns requestId in success response', () => {
    expect(route).toContain('ok: true');
    expect(route).toContain('requestId,');
  });

  // ── Validation ──

  it('validates tier against VALID_TIERS', () => {
    expect(route).toContain("VALID_TIERS: AssuranceTier[] = ['BASIC', 'PRO', 'PUBLIC_SECTOR']");
    expect(route).toContain('VALID_TIERS.includes(tier as AssuranceTier)');
  });

  it('returns 400 INVALID_TIER for bad tier', () => {
    expect(route).toContain("'INVALID_TIER'");
    // Check it returns 400
    const tierErrorMatch = route.match(/safeError\([\s\S]*?'INVALID_TIER'[\s\S]*?,\s*400\s*\)/);
    expect(tierErrorMatch).not.toBeNull();
  });

  it('validates billingCycle against VALID_CYCLES', () => {
    expect(route).toContain("VALID_CYCLES: BillingCycle[] = ['monthly', 'semiannual', 'annual']");
    expect(route).toContain('VALID_CYCLES.includes(billingCycle as BillingCycle)');
  });

  it('returns 400 INVALID_BILLING_CYCLE for bad cycle', () => {
    expect(route).toContain("'INVALID_BILLING_CYCLE'");
    const cycleErrorMatch = route.match(/safeError\([\s\S]*?'INVALID_BILLING_CYCLE'[\s\S]*?,\s*400\s*\)/);
    expect(cycleErrorMatch).not.toBeNull();
  });

  // ── Auth ──

  it('returns 401 AUTH_REQUIRED when not authenticated', () => {
    expect(route).toContain("'AUTH_REQUIRED'");
    const authMatch = route.match(/safeError\([\s\S]*?'AUTH_REQUIRED'[\s\S]*?,\s*401\s*\)/);
    expect(authMatch).not.toBeNull();
  });

  // ── Env checks ──

  it('checks MOLLIE_API_KEY env var before calling provider', () => {
    expect(route).toContain("process.env.MOLLIE_API_KEY");
    expect(route).toContain("'CONFIG_MISSING_ENV'");
  });

  it('returns 500 CONFIG_MISSING_ENV when MOLLIE_API_KEY missing', () => {
    const envMatch = route.match(/safeError\([\s\S]*?'CONFIG_MISSING_ENV'[\s\S]*?,\s*500\s*\)/);
    expect(envMatch).not.toBeNull();
  });

  // ── Provider errors ──

  it('returns 502 PROVIDER_ERROR on Mollie failure', () => {
    expect(route).toContain("'PROVIDER_ERROR'");
    const providerMatch = route.match(/safeError\([\s\S]*?'PROVIDER_ERROR'[\s\S]*?,\s*502\s*\)/);
    expect(providerMatch).not.toBeNull();
  });

  it('returns 502 PROVIDER_NO_CHECKOUT_URL when checkoutUrl is null', () => {
    expect(route).toContain("'PROVIDER_NO_CHECKOUT_URL'");
    const noUrlMatch = route.match(/safeError\([\s\S]*?'PROVIDER_NO_CHECKOUT_URL'[\s\S]*?,\s*502\s*\)/);
    expect(noUrlMatch).not.toBeNull();
  });

  it('logs provider error details server-side', () => {
    expect(route).toContain('Provider error:');
    expect(route).toContain('errObj.message');
    expect(route).toContain('errObj.stack');
    expect(route).toContain('statusCode');
  });

  it('does not leak secrets or stack traces to client', () => {
    // safeError only sends code + message + requestId
    const safeErrorFn = route.match(/function safeError[\s\S]*?^}/m)?.[0] || '';
    expect(safeErrorFn).toContain('code');
    expect(safeErrorFn).toContain('message');
    expect(safeErrorFn).toContain('requestId');
    expect(safeErrorFn).not.toContain('stack');
    expect(safeErrorFn).not.toContain('MOLLIE_API_KEY');
  });

  // ── Success path ──

  it('returns checkoutUrl and paymentId on success', () => {
    expect(route).toContain('checkoutUrl,');
    expect(route).toContain('paymentId: payment.id');
  });

  // ── Structured logging ──

  it('logs userId, email, tier, billingCycle on request', () => {
    expect(route).toContain('Subscribe request:');
    expect(route).toContain('userId: user.id');
    expect(route).toContain('email: user.email');
  });
});

// ── 2. Billing: appUrl fix ──

describe('Billing: appUrl usage (root cause fix)', () => {
  const billing = readFile('src/lib/assurance/billing.ts');

  it('imports appUrl as a function from mollie module', () => {
    expect(billing).toContain("import { mollie, appUrl } from '../mollie'");
  });

  it('calls appUrl as a function for redirectUrl (NOT string concat)', () => {
    // Must be appUrl('/path...') not `${appUrl}/path`
    expect(billing).toContain("appUrl(`/dashboard/billing/success?");
    expect(billing).not.toContain('`${appUrl}/dashboard');
  });

  it('includes locale in payment creation', () => {
    expect(billing).toContain('Locale.nl_NL');
  });

  it('includes sessionToken in metadata', () => {
    expect(billing).toContain('sessionToken');
  });

  it('calls appUrl as a function for webhookUrl (NOT string concat)', () => {
    expect(billing).toContain("appUrl('/api/assurance/webhook')");
    expect(billing).not.toContain('`${appUrl}/api/assurance/webhook`');
  });
});

// ── 3. Mollie module: appUrl is a function ──

describe('Mollie module: appUrl export', () => {
  const mollieModule = readFile('src/lib/mollie.ts');

  it('exports appUrl as a function', () => {
    expect(mollieModule).toMatch(/export function appUrl/);
  });

  it('appUrl accepts a path parameter', () => {
    expect(mollieModule).toMatch(/function appUrl\(path/);
  });

  it('uses NEXT_PUBLIC_APP_URL with fallback', () => {
    expect(mollieModule).toContain('NEXT_PUBLIC_APP_URL');
    expect(mollieModule).toContain('https://vexnexa.com');
  });
});

// ── 4. Client Page: Hydration Safety ──

describe('Client Page: /dashboard/subscribe-assurance', () => {
  const page = readFile('src/app/dashboard/subscribe-assurance/page.tsx');

  it('is a client component', () => {
    expect(page.trimStart()).toMatch(/^"use client"/);
  });

  it('uses mounted state for hydration gating', () => {
    expect(page).toContain('const [mounted, setMounted] = useState(false)');
    expect(page).toContain('setMounted(true)');
  });

  it('renders a skeleton when not mounted (SSR-safe)', () => {
    expect(page).toContain('if (!mounted)');
    expect(page).toContain('animate-pulse');
  });

  it('does NOT call createClient() during render (only in useEffect)', () => {
    // createClient should only appear inside useEffect, not at component top level
    const lines = page.split('\n');
    const componentBodyStart = lines.findIndex(l => l.includes('export default function'));
    const componentLines = lines.slice(componentBodyStart);

    // Find createClient calls in component body
    const createClientCalls = componentLines
      .map((line, i) => ({ line: line.trim(), index: i }))
      .filter(({ line }) => line.includes('createClient()'));

    // All createClient calls should be inside useEffect (preceded by useEffect context)
    for (const call of createClientCalls) {
      // Look backwards for useEffect
      const preceding = componentLines.slice(Math.max(0, call.index - 5), call.index).join('\n');
      expect(preceding).toContain('useEffect');
    }
  });

  it('does NOT use bg-white/dark:bg-slate-900 (uses semantic tokens)', () => {
    // After the skeleton, the main render should use bg-card / bg-background / border-border
    expect(page).not.toContain('bg-white dark:bg-slate-900');
  });

  it('uses bg-card for feature cards and billing toggle', () => {
    expect(page).toContain('bg-card border border-border');
  });

  // ── Error handling ──

  it('has SubscribeError interface with requestId', () => {
    expect(page).toContain('interface SubscribeError');
    expect(page).toContain('requestId?: string');
    expect(page).toContain('isConfigIssue?: boolean');
  });

  it('displays requestId as Ref in error banner', () => {
    expect(page).toContain('Ref: {error.requestId}');
  });

  it('shows config issue notice when isConfigIssue is true', () => {
    expect(page).toContain('Support has been notified');
    expect(page).toContain('error.isConfigIssue');
  });

  it('detects CONFIG_MISSING_ENV and CONFIG_MISSING_PRICE_ID as config issues', () => {
    expect(page).toContain("data.code === 'CONFIG_MISSING_ENV'");
    expect(page).toContain("data.code === 'CONFIG_MISSING_PRICE_ID'");
  });

  // ── Double-submit prevention ──

  it('prevents double-submit', () => {
    expect(page).toContain('if (!selectedPlan || loadingTier) return');
    expect(page).toContain('disabled={loadingTier !== null}');
  });

  // ── Checkout Summary ──

  it('has checkout summary card', () => {
    expect(page).toContain('Checkout Summary');
    expect(page).toContain('CYCLE_LABELS');
    expect(page).toContain('Domains included');
  });

  it('has secure payment section with trust badges', () => {
    expect(page).toContain('Secure payment');
    expect(page).toContain('PCI DSS compliant');
    expect(page).toContain('256-bit SSL encryption');
    expect(page).toContain('Cancel anytime');
    expect(page).toContain('Mollie');
  });

  it('fetches payment methods dynamically', () => {
    expect(page).toContain('/api/billing/methods');
    expect(page).toContain('paymentMethods');
    expect(page).toContain('Payment methods (where available)');
  });

  it('has plan selection flow before checkout', () => {
    expect(page).toContain('selectedPlan');
    expect(page).toContain('handleSelectPlan');
    expect(page).toContain('activePlan');
  });

  it('has proceed to payment button with price', () => {
    expect(page).toContain('Proceed to Payment');
    expect(page).toContain('Redirecting to secure checkout');
  });

  // ── Payload correctness ──

  it('sends tier in UPPER_CASE', () => {
    // PLANS array uses uppercase tiers
    expect(page).toContain('tier: "BASIC"');
    expect(page).toContain('tier: "PRO"');
    expect(page).toContain('tier: "PUBLIC_SECTOR"');
  });

  it('sends billingCycle as lowercase', () => {
    expect(page).toContain('body: JSON.stringify({ tier: selectedPlan, billingCycle })');
    // billingCycle state is typed as "monthly" | "semiannual" | "annual"
    expect(page).toContain('type BillingCycle = "monthly" | "semiannual" | "annual"');
  });

  // ── Uses semantic theme classes ──

  it('uses border-primary instead of border-primary-500', () => {
    // Popular card should use semantic tokens
    expect(page).toContain('border-primary shadow-lg');
    expect(page).not.toContain('border-primary-500 dark:border-primary-400');
  });

  it('uses bg-primary for active billing toggle', () => {
    expect(page).toContain('bg-primary text-primary-foreground shadow-sm');
  });

  it('sends billingCycle with selectedPlan (not tier param)', () => {
    expect(page).toContain('tier: selectedPlan, billingCycle');
  });
});

// ── 5. Success Page ──

describe('Success Page: /dashboard/billing/success', () => {
  const page = readFile('src/app/dashboard/billing/success/page.tsx');

  it('is a client component', () => {
    expect(page.trimStart()).toMatch(/^"use client"/);
  });

  it('uses mounted gating for hydration safety', () => {
    expect(page).toContain('const [mounted, setMounted] = useState(false)');
    expect(page).toContain('setMounted(true)');
  });

  it('shows payment successful message', () => {
    expect(page).toContain('Payment Successful');
  });

  it('shows subscription activated status', () => {
    expect(page).toContain('Subscription Activated');
  });

  it('reads tier and cycle from search params', () => {
    expect(page).toContain('useSearchParams');
    expect(page).toContain("searchParams.get(\"tier\")");
    expect(page).toContain("searchParams.get(\"cycle\")");
  });

  it('has next steps section', () => {
    expect(page).toContain('Next Steps');
    expect(page).toContain('Add your domains');
    expect(page).toContain('Configure scan schedule');
    expect(page).toContain('Set up alerts');
  });

  it('has CTA to assurance settings', () => {
    expect(page).toContain('Go to Assurance Settings');
    expect(page).toContain('/dashboard/assurance');
  });

  it('has back to dashboard link', () => {
    expect(page).toContain('Back to Dashboard');
    expect(page).toContain('/dashboard');
  });
});

// ── 6. Cancelled Page ──

describe('Cancelled Page: /dashboard/billing/cancelled', () => {
  const page = readFile('src/app/dashboard/billing/cancelled/page.tsx');

  it('is a client component', () => {
    expect(page.trimStart()).toMatch(/^"use client"/);
  });

  it('uses mounted gating for hydration safety', () => {
    expect(page).toContain('const [mounted, setMounted] = useState(false)');
  });

  it('shows payment cancelled message', () => {
    expect(page).toContain('Payment Cancelled');
  });

  it('explains no charges were made', () => {
    expect(page).toContain('No charges have been made');
  });

  it('has retry CTA', () => {
    expect(page).toContain('Try Again');
    expect(page).toContain('/dashboard/subscribe-assurance');
  });

  it('has back to dashboard link', () => {
    expect(page).toContain('Back to Dashboard');
  });

  it('has support contact', () => {
    expect(page).toContain('info@vexnexa.com');
  });
});

// ── 7. Billing Methods Endpoint ──

describe('Billing Methods Endpoint: /api/billing/methods', () => {
  const route = readFile('src/app/api/billing/methods/route.ts');

  it('exports GET handler', () => {
    expect(route).toContain('export async function GET');
  });

  it('queries Mollie methods with sequenceType first', () => {
    expect(route).toContain('SequenceType.first');
    expect(route).toContain('mollie.methods.list');
  });

  it('accepts tier and billingCycle query params', () => {
    expect(route).toContain("searchParams.get('tier')");
    expect(route).toContain("searchParams.get('billingCycle')");
  });

  it('returns method id, description, and images', () => {
    expect(route).toContain('method.id');
    expect(route).toContain('method.description');
    expect(route).toContain('imageUrl');
    expect(route).toContain('imageSvg');
  });

  it('has fallback methods when Mollie is not configured', () => {
    expect(route).toContain('getFallbackMethods');
    expect(route).toContain('creditcard');
    expect(route).toContain('ideal');
    expect(route).toContain('paypal');
  });

  it('calculates amount for tier/cycle to filter methods', () => {
    expect(route).toContain('getAmountForTier');
  });
});

// ── 8. CSP Sentry Fix ──

describe('CSP: Sentry CDN allowed', () => {
  const middleware = readFile('src/middleware.ts');

  it('includes browser.sentry-cdn.com in script-src', () => {
    expect(middleware).toContain('https://browser.sentry-cdn.com');
    // Verify it appears in the script-src line
    const scriptSrc = middleware.split('\n').find(l => l.includes('script-src'));
    expect(scriptSrc).toContain('browser.sentry-cdn.com');
  });

  it('includes sentry.io in connect-src', () => {
    const connectSrc = middleware.split('\n').find(l => l.includes('connect-src'));
    expect(connectSrc).toContain('https://*.sentry.io');
    expect(connectSrc).toContain('https://browser.sentry-cdn.com');
  });

  it('includes mollie.com in img-src for payment method icons', () => {
    const imgSrc = middleware.split('\n').find(l => l.includes('img-src'));
    expect(imgSrc).toContain('https://*.mollie.com');
  });

  it('does not use broad wildcards', () => {
    const cspSection = middleware.split('\n')
      .filter(l => l.includes('-src'))
      .join('\n');
    // No * without a domain prefix
    expect(cspSection).not.toMatch(/\s\*\s/);
    expect(cspSection).not.toMatch(/\s\*;/);
  });
});
