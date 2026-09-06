// @vitest-environment jsdom

import { NextIntlClientProvider } from 'next-intl';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import deMessages from '../../../messages/de.json';
import enMessages from '../../../messages/en.json';
import esMessages from '../../../messages/es.json';
import frMessages from '../../../messages/fr.json';
import nlMessages from '../../../messages/nl.json';
import ptMessages from '../../../messages/pt.json';
import { trackEvent } from '@/lib/analytics-events';
import { PLAN_PRICES } from '@/lib/billing/pricing-config';
import { ENTITLEMENTS } from '@/lib/billing/plans';
import { PartnerApplicationForm } from '@/components/partner-apply/PartnerApplicationForm';
import type { PartnerApplyState } from '@/app/actions/partner-application';
import { AgencyOfferBanner } from './AgencyOfferBanner';
import { FoundingProgramClosed } from './FoundingProgramClosed';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));
vi.mock('@/lib/analytics-events', () => ({ trackEvent: vi.fn() }));

const localeMessages = { en: enMessages, nl: nlMessages, de: deMessages, fr: frMessages, es: esMessages, pt: ptMessages };
type Locale = keyof typeof localeMessages;
const locales = Object.keys(localeMessages) as Locale[];
const billingTerms: Record<Locale, readonly [RegExp, RegExp]> = {
  en: [/monthly subscription/i, /automatic renewal/i],
  nl: [/maandabonnement/i, /automatische verlenging/i],
  de: [/Monatsabonnement/i, /automatischer Verlängerung/i],
  fr: [/Abonnement mensuel/i, /renouvellement automatique/i],
  es: [/Suscripción mensual/i, /renovación automática/i],
  pt: [/Subscrição mensal/i, /renovação automática/i],
};
const preservedAgreements: Record<Locale, RegExp> = {
  en: /does not change existing agreements/i,
  nl: /verandert niets aan bestaande afspraken/i,
  de: /ändert keine bestehenden Vereinbarungen/i,
  fr: /ne modifie pas les accords existants/i,
  es: /no modifica los acuerdos existentes/i,
  pt: /não altera os acordos existentes/i,
};
const roots: Root[] = [];
const fetchMock = vi.fn();

beforeEach(() => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  fetchMock.mockReset().mockRejectedValue(new Error('Unexpected request in an offer rendering test'));
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  act(() => roots.splice(0).forEach((root) => root.unmount()));
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

function renderOffer(children: ReactNode, locale: Locale) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);
  const onIntlError = vi.fn();
  act(() => root.render(
    <NextIntlClientProvider locale={locale} messages={localeMessages[locale]} timeZone="UTC" onError={onIntlError}>
      {children}
    </NextIntlClientProvider>
  ));
  return { container, onIntlError };
}

function href(locale: Locale, path: string) {
  return locale === 'en' ? path : `/${locale}${path}`;
}

function expectNoApplicationOffer(container: HTMLElement, locale: Locale) {
  expect(container.querySelector('form')).toBeNull();
  expect(container.querySelector('input, textarea, select, button[type="submit"]')).toBeNull();
  const links = Array.from(container.querySelectorAll('a'));
  for (const link of links) {
    expect(link.getAttribute('href')).not.toMatch(/partner-apply|founding-agencies|pilot-partner-program|(?:pilot|founding)-waitlist/);
    expect(link.textContent).not.toContain(localeMessages[locale].partnerApply.hero.ctaClaim);
  }
  expect(container.textContent).not.toContain(localeMessages[locale].partnerApply.hero.title);
}

function expectOfferLinks(container: HTMLElement, locale: Locale) {
  const messages = localeMessages[locale].agencyOffer;
  expect(container.querySelector(`a[href="${href(locale, '/pricing#agency')}"]`)?.textContent).toBe(messages.cta);
  expect(container.querySelector(`a[href="${href(locale, '/sample-report')}"]`)?.textContent).toBe(messages.sampleCta);
}

describe.each(locales)('Agency offer in %s', (locale) => {
  it('shows the configured VAT-inclusive monthly price, site scope and automatic renewal', () => {
    const { container, onIntlError } = renderOffer(<AgencyOfferBanner location="test-offer" />, locale);
    const messages = localeMessages[locale].agencyOffer;
    expect(PLAN_PRICES.BUSINESS.monthly).toBe(99.95);
    const formattedPrice = new Intl.NumberFormat(locale, {
      style: 'currency', currency: 'EUR', minimumFractionDigits: 2,
    }).format(PLAN_PRICES.BUSINESS.monthly);
    expect(container.textContent).toContain(messages.price.replace('{price}', formattedPrice));
    expect(container.textContent).toContain(messages.description.replace('{sites}', String(ENTITLEMENTS.BUSINESS.sites)));
    expect(container.textContent).toContain(messages.billingNote);
    for (const term of billingTerms[locale]) expect(messages.billingNote).toMatch(term);
    const heading = container.querySelector('h2')!;
    expect(heading.textContent).toBe(messages.title);
    expect(container.querySelector('section')?.getAttribute('aria-labelledby')).toBe(heading.id);
    expectOfferLinks(container, locale);
    expect(container.querySelectorAll('a')).toHaveLength(2);
    expectNoApplicationOffer(container, locale);
    expect(onIntlError).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('explains closure without retracting existing applications or agreed benefits', () => {
    const { container, onIntlError } = renderOffer(<FoundingProgramClosed />, locale);
    const messages = localeMessages[locale].agencyOffer;
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(container.querySelector('h1')?.textContent).toBe(messages.closedTitle);
    expect(container.textContent).toContain(messages.closedDescription);
    expect(container.querySelector('h2')?.textContent).toBe(messages.existingTitle);
    expect(container.textContent).toContain(messages.existingDescription);
    expect(messages.existingDescription).toMatch(preservedAgreements[locale]);
    expect(container.querySelector(`a[href="${href(locale, '/contact?from=existing-founding-agency')}"]`)?.textContent)
      .toBe(messages.existingCta);
    expectOfferLinks(container, locale);
    expect(container.querySelectorAll('a')).toHaveLength(3);
    expectNoApplicationOffer(container, locale);
    expect(onIntlError).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each<PartnerApplyState>([
    { ok: false },
    { ok: true },
    { ok: false, programClosed: true, errorKey: 'programClosed' },
  ])('keeps stale application UI closed for action state %j, even with available spots', (state) => {
    const formAction = vi.fn();
    const { container, onIntlError } = renderOffer(
      <PartnerApplicationForm formAction={formAction} state={state} pending={false} remaining={10} />,
      locale,
    );
    expect(container.querySelector('h1')?.textContent).toBe(localeMessages[locale].agencyOffer.closedTitle);
    expect(container.textContent).toContain(localeMessages[locale].agencyOffer.existingDescription);
    expectOfferLinks(container, locale);
    expectNoApplicationOffer(container, locale);
    expect(formAction).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(onIntlError).not.toHaveBeenCalled();
  });
});

it('tracks only the paid Agency CTA with its placement and retains the localized destination', () => {
  const { container, onIntlError } = renderOffer(<AgencyOfferBanner location="pricing-footer" />, 'nl');
  container.addEventListener('click', (event) => event.preventDefault());
  const sampleLink = container.querySelector<HTMLAnchorElement>('a[href="/nl/sample-report"]')!;
  act(() => sampleLink.click());
  expect(trackEvent).not.toHaveBeenCalled();
  const agencyLink = container.querySelector<HTMLAnchorElement>('a[href="/nl/pricing#agency"]')!;
  act(() => agencyLink.click());
  expect(trackEvent).toHaveBeenCalledExactlyOnceWith('agency_offer_cta_click', { location: 'pricing-footer' });
  expect(agencyLink.getAttribute('href')).toBe('/nl/pricing#agency');
  expect(fetchMock).not.toHaveBeenCalled();
  expect(onIntlError).not.toHaveBeenCalled();
});

it('gives repeated paid banners distinct accessible heading references', () => {
  const { container, onIntlError } = renderOffer(<>
    <AgencyOfferBanner location="top" />
    <AgencyOfferBanner location="bottom" />
  </>, 'en');
  const sections = Array.from(container.querySelectorAll('section'));
  const ids = sections.map((section) => section.getAttribute('aria-labelledby'));
  expect(new Set(ids).size).toBe(2);
  for (const section of sections) {
    expect(section.getAttribute('aria-labelledby')).toBe(section.querySelector('h2')?.id);
  }
  expect(onIntlError).not.toHaveBeenCalled();
});
