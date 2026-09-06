import { describe, expect, it } from 'vitest';
import {
  FOUNDING_APPLICATIONS_OPEN,
  FOUNDING_APPLICATIONS_CLOSED_CODE,
  FOUNDING_APPLICATIONS_CLOSED_MESSAGE,
} from './founding-program';
import {
  FOUNDING_DISCOUNT,
  FOUNDING_DISCOUNT_PERCENT,
  FOUNDING_FREE_MONTHS,
  FOUNDING_MAX_SPOTS,
  PLAN_PRICES,
  getFoundingAgencyPrice,
} from './billing/pricing-config';

describe('founding intake policy and historical benefits', () => {
  it('closes only new applications with a stable machine-readable status', () => {
    expect(FOUNDING_APPLICATIONS_OPEN).toBe(false);
    expect(FOUNDING_APPLICATIONS_CLOSED_CODE).toBe('FOUNDING_APPLICATIONS_CLOSED');
    expect(FOUNDING_APPLICATIONS_CLOSED_MESSAGE).toContain('applications are closed');
    expect(FOUNDING_APPLICATIONS_CLOSED_MESSAGE).toContain('Existing applications and agreed benefits are unchanged');
  });

  it('retains the historical free period, permanent discount and original capacity', () => {
    expect(FOUNDING_FREE_MONTHS).toBe(12);
    expect(FOUNDING_DISCOUNT).toBe(0.3);
    expect(FOUNDING_DISCOUNT_PERCENT).toBe(30);
    expect(FOUNDING_MAX_SPOTS).toBe(10);
  });

  it.each(['monthly', 'yearly'] as const)('does not turn off historical %s founding pricing', (interval) => {
    const expected = Math.round(PLAN_PRICES.BUSINESS[interval] * 0.7 * 100) / 100;
    expect(getFoundingAgencyPrice(interval)).toBe(expected);
    expect(getFoundingAgencyPrice(interval)).toBeLessThan(PLAN_PRICES.BUSINESS[interval]);
  });
});
