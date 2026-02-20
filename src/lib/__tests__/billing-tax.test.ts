/**
 * Tests for billing countries, tax logic, billing profile, and VAT validation.
 *
 * Covers:
 * - Country list completeness and EU membership
 * - determineTax() for all regimes
 * - calculateAmountBreakdown correctness
 * - VAT ID format validation
 * - Billing profile API schema
 * - Subscribe endpoint uses determineTax and persists taxRegime
 * - Onboarding page billing identity UI
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  determineTax,
  calculateAmountBreakdown,
  validateVatIdFormat,
  normalizeVatId,
} from '../billing/tax';
import { COUNTRIES, isEuCountry, isNlCountry, getCountryByCode } from '../billing/countries';

function readFile(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf-8');
}

// ── 1. Country List ──

describe('Country list (ISO-3166)', () => {
  const countriesModule = readFile('src/lib/billing/countries.ts');

  it('exports COUNTRIES array', () => {
    expect(countriesModule).toContain('export const COUNTRIES: Country[]');
  });

  it('contains Netherlands (NL)', () => {
    expect(countriesModule).toContain('{ code: "NL", name: "Netherlands", eu: true }');
  });

  it('contains Belgium (BE)', () => {
    expect(countriesModule).toContain('{ code: "BE", name: "Belgium", eu: true }');
  });

  it('contains Germany (DE)', () => {
    expect(countriesModule).toContain('{ code: "DE", name: "Germany", eu: true }');
  });

  it('contains United States (US)', () => {
    expect(countriesModule).toContain('{ code: "US", name: "United States", eu: false }');
  });

  it('contains Japan (JP)', () => {
    expect(countriesModule).toContain('{ code: "JP", name: "Japan", eu: false }');
  });

  it('contains United Kingdom (GB) as non-EU', () => {
    expect(countriesModule).toContain('{ code: "GB", name: "United Kingdom", eu: false }');
  });

  it('exports isEuCountry function', () => {
    expect(countriesModule).toContain('export function isEuCountry(');
  });

  it('exports isNlCountry function', () => {
    expect(countriesModule).toContain('export function isNlCountry(');
  });

  it('exports getCountryByCode function', () => {
    expect(countriesModule).toContain('export function getCountryByCode(');
  });

  it('has 27 EU member states in EU_COUNTRY_CODES', () => {
    expect(countriesModule).toContain('export const EU_COUNTRY_CODES = new Set(');
    // Count the codes in the Set constructor
    const setMatch = countriesModule.match(/EU_COUNTRY_CODES = new Set\(\[\s*([\s\S]*?)\]\)/);
    expect(setMatch).toBeDefined();
    const codes = setMatch![1].match(/"[A-Z]{2}"/g);
    expect(codes).toBeDefined();
    expect(codes!.length).toBe(27);
  });
});

// ── 2. determineTax Logic ──

describe('determineTax()', () => {
  // We test by reading the source and verifying the logic structure
  const taxModule = readFile('src/lib/billing/tax.ts');

  it('exports determineTax function', () => {
    expect(taxModule).toContain('export function determineTax(');
  });

  it('exports TaxRegime type with 3 regimes', () => {
    expect(taxModule).toContain('"NL_VAT"');
    expect(taxModule).toContain('"EU_REVERSE_CHARGE"');
    expect(taxModule).toContain('"NON_EU_NO_VAT"');
  });

  it('exports calculateAmountBreakdown function', () => {
    expect(taxModule).toContain('export function calculateAmountBreakdown(');
  });

  it('returns 21% for NL customers', () => {
    expect(taxModule).toContain('if (isNlCountry(country))');
    // NL block should return vatRate: 0.21
    const nlBlock = taxModule.slice(
      taxModule.indexOf('if (isNlCountry(country))'),
      taxModule.indexOf('// Rule 2')
    );
    expect(nlBlock).toContain('vatRate: 0.21');
    expect(nlBlock).toContain('"NL_VAT"');
  });

  it('returns 0% reverse charge for EU business with valid VAT and country != NL', () => {
    expect(taxModule).toContain('isEuCountry(country)');
    expect(taxModule).toContain("profile.billingType === \"business\"");
    expect(taxModule).toContain('profile.vatValid');
    // The reverse charge block
    const rcBlock = taxModule.slice(
      taxModule.indexOf('// Rule 2'),
      taxModule.indexOf('// Rule 4')
    );
    expect(rcBlock).toContain('vatRate: 0');
    expect(rcBlock).toContain('"EU_REVERSE_CHARGE"');
  });

  it('returns 21% for EU individual (B2C)', () => {
    // Rule 4/5 block
    const euB2cBlock = taxModule.slice(
      taxModule.indexOf('// Rule 4'),
      taxModule.indexOf('// Rule 3')
    );
    expect(euB2cBlock).toContain('vatRate: 0.21');
    expect(euB2cBlock).toContain('"NL_VAT"');
  });

  it('returns 0% for non-EU customers', () => {
    // Rule 3 block (last return)
    const nonEuBlock = taxModule.slice(taxModule.indexOf('// Rule 3'));
    expect(nonEuBlock).toContain('vatRate: 0');
    expect(nonEuBlock).toContain('"NON_EU_NO_VAT"');
  });

  it('exports VAT_ID_PATTERNS for EU countries', () => {
    expect(taxModule).toContain('export const VAT_ID_PATTERNS');
    expect(taxModule).toContain('NL:');
    expect(taxModule).toContain('DE:');
    expect(taxModule).toContain('FR:');
    expect(taxModule).toContain('BE:');
  });

  it('exports validateVatIdFormat function', () => {
    expect(taxModule).toContain('export function validateVatIdFormat(');
  });

  it('exports normalizeVatId function', () => {
    expect(taxModule).toContain('export function normalizeVatId(');
  });
});

// ── 3. determineTax Runtime Tests ──

describe('determineTax() runtime', () => {
  it('NL individual => 21% NL_VAT', () => {
    const result = determineTax({ countryCode: 'NL', billingType: 'individual', vatValid: false });
    expect(result.vatRate).toBe(0.21);
    expect(result.regime).toBe('NL_VAT');
  });

  it('NL business => 21% NL_VAT (even with valid VAT)', () => {
    const result = determineTax({ countryCode: 'NL', billingType: 'business', vatValid: true });
    expect(result.vatRate).toBe(0.21);
    expect(result.regime).toBe('NL_VAT');
  });

  it('DE business with valid VAT => 0% EU_REVERSE_CHARGE', () => {
    const result = determineTax({ countryCode: 'DE', billingType: 'business', vatValid: true });
    expect(result.vatRate).toBe(0);
    expect(result.regime).toBe('EU_REVERSE_CHARGE');
    expect(result.invoiceNote).toContain('reverse charge');
  });

  it('DE business without valid VAT => 21% NL_VAT', () => {
    const result = determineTax({ countryCode: 'DE', billingType: 'business', vatValid: false });
    expect(result.vatRate).toBe(0.21);
    expect(result.regime).toBe('NL_VAT');
  });

  it('FR individual => 21% NL_VAT', () => {
    const result = determineTax({ countryCode: 'FR', billingType: 'individual', vatValid: false });
    expect(result.vatRate).toBe(0.21);
    expect(result.regime).toBe('NL_VAT');
  });

  it('US business => 0% NON_EU_NO_VAT', () => {
    const result = determineTax({ countryCode: 'US', billingType: 'business', vatValid: false });
    expect(result.vatRate).toBe(0);
    expect(result.regime).toBe('NON_EU_NO_VAT');
  });

  it('US individual => 0% NON_EU_NO_VAT', () => {
    const result = determineTax({ countryCode: 'US', billingType: 'individual', vatValid: false });
    expect(result.vatRate).toBe(0);
    expect(result.regime).toBe('NON_EU_NO_VAT');
  });

  it('JP business => 0% NON_EU_NO_VAT', () => {
    const result = determineTax({ countryCode: 'JP', billingType: 'business', vatValid: false });
    expect(result.vatRate).toBe(0);
    expect(result.regime).toBe('NON_EU_NO_VAT');
  });

  it('GB business => 0% NON_EU_NO_VAT (post-Brexit)', () => {
    const result = determineTax({ countryCode: 'GB', billingType: 'business', vatValid: false });
    expect(result.vatRate).toBe(0);
    expect(result.regime).toBe('NON_EU_NO_VAT');
  });

  it('BE business with valid VAT => 0% EU_REVERSE_CHARGE', () => {
    const result = determineTax({ countryCode: 'BE', billingType: 'business', vatValid: true });
    expect(result.vatRate).toBe(0);
    expect(result.regime).toBe('EU_REVERSE_CHARGE');
  });

  it('calculateAmountBreakdown: 9.99 net + 21% VAT', () => {
    const tax = determineTax({ countryCode: 'NL', billingType: 'individual', vatValid: false });
    const breakdown = calculateAmountBreakdown(9.99, tax);
    expect(breakdown.net).toBe(9.99);
    expect(breakdown.vat).toBe(2.1);
    expect(breakdown.gross).toBe(12.09);
  });

  it('calculateAmountBreakdown: 24.99 net + 0% VAT (reverse charge)', () => {
    const tax = determineTax({ countryCode: 'DE', billingType: 'business', vatValid: true });
    const breakdown = calculateAmountBreakdown(24.99, tax);
    expect(breakdown.net).toBe(24.99);
    expect(breakdown.vat).toBe(0);
    expect(breakdown.gross).toBe(24.99);
  });
});

// ── 4. VAT ID Format Validation Runtime ──

describe('validateVatIdFormat() runtime', () => {
  it('validates NL VAT ID format', () => {
    expect(validateVatIdFormat('NL', 'NL123456789B01')).toBe(true);
    expect(validateVatIdFormat('NL', 'NL12345678B01')).toBe(false); // too short
  });

  it('validates DE VAT ID format', () => {
    expect(validateVatIdFormat('DE', 'DE123456789')).toBe(true);
    expect(validateVatIdFormat('DE', 'DE12345')).toBe(false);
  });

  it('validates BE VAT ID format', () => {
    expect(validateVatIdFormat('BE', 'BE0123456789')).toBe(true);
  });

  it('validates FR VAT ID format', () => {
    expect(validateVatIdFormat('FR', 'FR12345678901')).toBe(true);
  });

  it('returns false for non-EU country', () => {
    expect(validateVatIdFormat('US', 'US123456789')).toBe(false);
  });

  it('normalizeVatId strips whitespace and uppercases', () => {
    expect(normalizeVatId('nl 123 456 789 b01')).toBe('NL123456789B01');
    expect(normalizeVatId('de.123.456.789')).toBe('DE123456789');
  });
});

// ── 5. Onboarding Page: Billing Identity UI ──

describe('Onboarding Page: Billing Identity', () => {
  const page = readFile('src/app/onboarding/page.tsx');

  it('imports CountrySelect component', () => {
    expect(page).toContain("import { CountrySelect } from '@/components/ui/country-select'");
  });

  it('imports isEuCountry and isNlCountry', () => {
    expect(page).toContain("import { isEuCountry, isNlCountry } from '@/lib/billing/countries'");
  });

  it('has BillingType type definition', () => {
    expect(page).toContain("type BillingType = 'individual' | 'business'");
  });

  it('has billingType in formData', () => {
    expect(page).toContain("billingType: 'individual' as BillingType");
  });

  it('has Individual/Business toggle buttons', () => {
    expect(page).toContain("Individual");
    expect(page).toContain("Business");
    expect(page).toContain("updateFormData('billingType', 'individual')");
    expect(page).toContain("updateFormData('billingType', 'business')");
  });

  it('shows Company Name field when business selected (required)', () => {
    expect(page).toContain("formData.billingType === 'business'");
    expect(page).toContain('Company Name *');
    expect(page).toContain('id="companyName"');
  });

  it('shows VAT ID field for EU countries', () => {
    expect(page).toContain('isEuCountry(formData.country)');
    expect(page).toContain('VAT ID (optional)');
    expect(page).toContain('id="vatId"');
  });

  it('shows KvK field for NL country', () => {
    expect(page).toContain('isNlCountry(formData.country)');
    expect(page).toContain('KvK-nummer (optional)');
    expect(page).toContain('id="kvkNumber"');
  });

  it('shows Tax ID field for non-EU countries', () => {
    expect(page).toContain('!isEuCountry(formData.country)');
    expect(page).toContain('Tax ID (optional)');
    expect(page).toContain('id="taxId"');
  });

  it('has VAT validation button and status messages', () => {
    expect(page).toContain('/api/billing/validate-vat');
    expect(page).toContain('Valid VAT ID');
    expect(page).toContain('Could not validate VAT ID');
    expect(page).toContain('VIES service unavailable');
  });

  it('has optional billing address fields', () => {
    expect(page).toContain('Billing Address (optional)');
    expect(page).toContain('addressLine1');
    expect(page).toContain('addressCity');
    expect(page).toContain('addressPostal');
    expect(page).toContain('addressRegion');
  });

  it('saves billing profile on submit', () => {
    expect(page).toContain('/api/billing/profile');
    expect(page).toContain('billingType: formData.billingType');
    expect(page).toContain('countryCode: formData.country');
  });

  it('uses CountrySelect instead of old Select dropdown', () => {
    expect(page).toContain('<CountrySelect');
    expect(page).not.toContain('SelectContent');
    expect(page).not.toContain('SelectItem');
  });
});

// ── 6. Subscribe Endpoint: Tax Integration ──

describe('Subscribe endpoint: tax integration', () => {
  const route = readFile('src/app/api/assurance/subscribe/route.ts');

  it('imports determineTax', () => {
    expect(route).toContain("import { determineTax } from '@/lib/billing/tax'");
  });

  it('imports prisma for billing profile lookup', () => {
    expect(route).toContain("import { prisma } from '@/lib/prisma'");
  });

  it('fetches billing profile before payment creation', () => {
    expect(route).toContain('prisma.billingProfile.findUnique');
    expect(route).toContain('userId: user.id');
  });

  it('calls determineTax with billing profile data', () => {
    expect(route).toContain('determineTax({');
    expect(route).toContain('countryCode: billingProfile.countryCode');
    expect(route).toContain('billingType: billingProfile.billingType');
    expect(route).toContain('vatValid: billingProfile.vatValid');
  });

  it('passes taxDecision to createAssuranceCheckoutPayment', () => {
    expect(route).toContain('taxDecision,');
    expect(route).toContain('countryCode,');
    expect(route).toContain('vatId,');
  });
});

// ── 7. Billing module: tax fields in payment ──

describe('Billing module: tax in payment creation', () => {
  const billing = readFile('src/lib/assurance/billing.ts');

  it('imports determineTax and calculateAmountBreakdown', () => {
    expect(billing).toContain("import { determineTax, calculateAmountBreakdown");
  });

  it('accepts taxDecision parameter', () => {
    expect(billing).toContain('taxDecision?: TaxDecision');
  });

  it('calculates gross amount with tax', () => {
    expect(billing).toContain('calculateAmountBreakdown(netAmount, tax)');
    expect(billing).toContain('const amount = breakdown.gross');
  });

  it('includes tax fields in payment metadata', () => {
    expect(billing).toContain("vatRate: String(tax.vatRate)");
    expect(billing).toContain('taxRegime: tax.regime');
    expect(billing).toContain("countryCode: countryCode || 'NL'");
    expect(billing).toContain('netAmount: String(breakdown.net)');
    expect(billing).toContain('vatAmount: String(breakdown.vat)');
  });

  it('persists vatRate and taxRegime in subscription record', () => {
    expect(billing).toContain('vatRate: vatRate ?? 0.21');
    expect(billing).toContain("taxRegime: taxRegime ?? 'NL_VAT'");
    expect(billing).toContain("countryCode: countryCode ?? 'NL'");
  });

  it('adds reverse charge note to payment description', () => {
    expect(billing).toContain("(reverse charge)");
  });
});

// ── 8. Prisma Schema: BillingProfile + tax fields ──

describe('Prisma schema: BillingProfile model', () => {
  const schema = readFile('prisma/schema.prisma');

  it('defines BillingProfile model', () => {
    expect(schema).toContain('model BillingProfile {');
  });

  it('has userId as unique field', () => {
    expect(schema).toContain('userId String @unique');
  });

  it('has billingType field', () => {
    expect(schema).toContain('billingType String @default("individual")');
  });

  it('has countryCode field', () => {
    expect(schema).toContain('countryCode String @default("NL")');
  });

  it('has vatId and vatValid fields', () => {
    expect(schema).toContain('vatId       String?');
    expect(schema).toContain('vatValid    Boolean   @default(false)');
  });

  it('has kvkNumber field for NL', () => {
    expect(schema).toContain('kvkNumber String?');
  });

  it('has billing address fields', () => {
    expect(schema).toContain('addressLine1 String?');
    expect(schema).toContain('addressCity  String?');
    expect(schema).toContain('addressPostal String?');
    expect(schema).toContain('addressRegion String?');
  });

  it('AssuranceSubscription has tax audit fields', () => {
    expect(schema).toContain('vatRate     Decimal? @db.Decimal(5, 4)');
    expect(schema).toContain('taxRegime   String?');
    // countryCode on AssuranceSubscription
    const assuranceSection = schema.slice(schema.indexOf('model AssuranceSubscription'));
    expect(assuranceSection).toContain('countryCode String?');
    expect(assuranceSection).toContain('vatId       String?');
  });

  it('User has billingProfile relation', () => {
    expect(schema).toContain('billingProfile BillingProfile?');
  });
});

// ── 9. VAT Validation Endpoint ──

describe('VAT validation endpoint: /api/billing/validate-vat', () => {
  const route = readFile('src/app/api/billing/validate-vat/route.ts');

  it('exports POST handler', () => {
    expect(route).toContain('export async function POST(');
  });

  it('validates countryCode and vatId are required', () => {
    expect(route).toContain('countryCode and vatId are required');
  });

  it('checks EU country before VIES validation', () => {
    expect(route).toContain('isEuCountry(countryCode)');
    expect(route).toContain('VAT validation is only available for EU countries');
  });

  it('validates format before VIES check', () => {
    expect(route).toContain('validateVatIdFormat(countryCode, vatId)');
    expect(route).toContain('Invalid VAT ID format');
  });

  it('calls VIES SOAP service', () => {
    expect(route).toContain('checkVies(countryCode, vatId)');
    expect(route).toContain('ec.europa.eu/taxation_customs/vies');
  });

  it('persists result to BillingProfile', () => {
    expect(route).toContain('prisma.billingProfile.upsert');
    expect(route).toContain('vatValid: viesValid');
    expect(route).toContain('vatCheckedAt: now');
  });

  it('handles VIES downtime gracefully', () => {
    expect(route).toContain('VIES unavailable');
    expect(route).toContain('warning');
  });
});

// ── 10. CountrySelect Component ──

describe('CountrySelect component', () => {
  const component = readFile('src/components/ui/country-select.tsx');

  it('is a client component', () => {
    expect(component.trimStart()).toMatch(/^"use client"/);
  });

  it('imports COUNTRIES from billing/countries', () => {
    expect(component).toContain("import { COUNTRIES");
  });

  it('has search input for filtering', () => {
    expect(component).toContain('Search countries');
    expect(component).toContain('search');
  });

  it('filters countries by name and code', () => {
    expect(component).toContain('c.name.toLowerCase().includes(q)');
    expect(component).toContain('c.code.toLowerCase().includes(q)');
  });

  it('displays country name and code', () => {
    expect(component).toContain('{country.name}');
    expect(component).toContain('{country.code}');
  });

  it('closes on outside click', () => {
    expect(component).toContain('mousedown');
    expect(component).toContain('setOpen(false)');
  });
});

// ── 11. Registration Form: CountrySelect ──

describe('Registration form: CountrySelect', () => {
  const form = readFile('src/components/auth/ModernRegistrationForm.tsx');

  it('imports CountrySelect', () => {
    expect(form).toContain("import { CountrySelect } from '@/components/ui/country-select'");
  });

  it('does not import old Select components', () => {
    expect(form).not.toContain("import { Select, SelectContent, SelectItem");
  });

  it('uses CountrySelect in step 3', () => {
    expect(form).toContain('<CountrySelect');
    expect(form).toContain("onValueChange={(code) => updateFormData('country', code)");
  });

  it('does not have hardcoded countries array', () => {
    expect(form).not.toContain("'Netherlands', 'Belgium', 'Germany'");
  });
});
