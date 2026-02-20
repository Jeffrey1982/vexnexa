# Billing Price Mode — Internal Documentation

## Overview

VexNexa supports an **Incl. VAT / Excl. VAT** toggle across all pricing surfaces.
Plan prices in the codebase are stored as **gross (inclusive of NL 21% VAT)**.
The toggle is display-only on the client; the server is the single source of truth for charged amounts.

---

## 1. Prices Stored as Gross

All plan prices in `src/lib/pricing.ts` (`BASE_PRICES`, `ANNUAL_PRICES`, add-on prices) are **inclusive of NL 21% VAT**.

- Starter: €24.99/mo (gross)
- Pro: €59.99/mo (gross)
- Business: €129/mo (gross)
- Enterprise: €299/mo (gross)

These values are **never changed** by the toggle. The toggle only affects how they are displayed.

---

## 2. Display Toggle

### State management
- **Store**: `src/lib/pricing/display-mode.ts`
  - `PriceDisplayMode = "incl" | "excl"`
  - Persisted in `localStorage` key `vexnexa_price_display_mode`
  - Default: `"incl"`
  - Listener pattern for cross-component sync
  - Optional profile sync via `PATCH /api/user/preferences`

### React hook
- `src/lib/pricing/use-price-display-mode.ts` — `usePriceDisplayMode()` returns `[mode, setMode]`

### UI component
- `src/components/pricing/PriceModeToggle.tsx` — segmented control with tooltip
- Appears on: marketing pricing page, assurance page, billing settings page

### Display math
- **Incl mode**: show gross price as-is
- **Excl mode**: `net = grossToNet(gross, 0.21)` using `src/lib/pricing/vat-math.ts`
- All conversions use integer-cent math to avoid floating-point drift
- Disclaimer shown: "Final taxes are calculated at checkout based on billing details."

---

## 3. Checkout Modal Gating

When the user clicks **"Verder naar betaling"**:

| Price Mode | Purchase As | Action |
|------------|-------------|--------|
| incl | individual | → Proceed directly to Mollie |
| incl | company | → Open CompanyDetailsModal |
| excl | individual | → Open CompanyDetailsModal |
| excl | company | → Open CompanyDetailsModal |

### CompanyDetailsModal (`src/components/checkout/CompanyDetailsModal.tsx`)
- Dutch copy: "Bedrijfsgegevens nodig voor excl. btw"
- Required fields: company name, billing country (ISO2), registration number (KvK for NL), VAT number
- Pre-fills from existing billing profile
- Client-side validation before submit
- On submit → calls `/api/billing/create-payment`

---

## 4. Server-Side Totals (Approach B)

### Endpoint: `POST /api/billing/create-payment`

**Input**: `{ plan, billingCycle, priceMode, purchaseAs, companyName?, billingCountry?, registrationNumber?, vatId? }`

**Server steps**:
1. Authenticate user (Supabase session)
2. **Validate company fields** server-side when `priceMode === "excl"` OR `purchaseAs === "company"` → return 400 with `fieldErrors` if missing
3. **Upsert billing profile** with company fields
4. **Compute price breakdown** (Approach B):
   ```
   planGross = calculatePrice(plan, billingCycle)     // e.g. €24.99
   netBase   = grossToNet(planGross, 0.21)            // e.g. €20.65
   taxDecision = computeTaxDecision(country, type, vatId)
   breakdown = calculateTaxBreakdown(netBase, taxDecision)
   totalToCharge = breakdown.gross                     // net + country tax
   ```
5. **Create Mollie payment** with `amount.value = totalToCharge`
   - Locale hint from billing country (e.g. NL → `nl_NL`)
   - No forced payment methods
   - Metadata includes: priceMode, purchaseAs, tax snapshot, company fields
6. **Persist CheckoutQuote** snapshot for invoicing/audit
7. **Return** `{ checkoutUrl, paymentId, breakdown }`

### Key invariant
For an NL consumer: `totalToCharge ≈ planGross` (same 21% re-applied to net base).
For EU B2B reverse charge: `totalToCharge = netBase` (tax = 0, lower than gross).

---

## 5. Consistency Guarantee

The checkout summary shows:
- Subtotal (ex. VAT): `breakdown.net`
- VAT line (rate + amount) OR "Reverse charge": `breakdown.vat`
- **Total**: `breakdown.gross`

The "Total" shown **always equals** the Mollie `amount.value`.
A confirmation line reads: "You will pay €X at Mollie".

---

## 6. Key Files

| File | Purpose |
|------|---------|
| `src/lib/pricing/vat-math.ts` | `grossToNet()`, `netToGross()`, `vatFromGross()`, `formatMoney()`, `BASE_VAT_RATE` |
| `src/lib/pricing/display-mode.ts` | Global price display mode state + localStorage |
| `src/lib/pricing/use-price-display-mode.ts` | React hook |
| `src/components/pricing/PriceModeToggle.tsx` | Segmented control UI |
| `src/components/checkout/CompanyDetailsModal.tsx` | Company fields modal (Dutch) |
| `src/app/api/billing/create-payment/route.ts` | Unified payment creation endpoint |
| `src/app/api/checkout/quote/route.ts` | Tax quote for display |
| `src/lib/billing/mollie-flows.ts` | `createUpgradePayment()` (legacy, also uses approach B) |
| `src/app/(marketing)/pricing/page.tsx` | Marketing pricing page |
| `src/app/dashboard/subscribe-assurance/page.tsx` | Assurance pricing page |
| `src/app/settings/billing/page.tsx` | Billing settings page |

---

## 7. Tests

`src/lib/__tests__/vat-display.test.ts` — 123 tests covering:
- grossToNet conversions (including prompt example: €49.99 → €41.31)
- netToGross conversions + roundtrip tolerance
- No double-VAT verification
- Display mode store structure
- PriceModeToggle component structure
- CompanyDetailsModal structure (Dutch copy, validation, pre-fill)
- create-payment endpoint (server validation, approach B, metadata, locale)
- Pricing page integration (modal flow, endpoint, Dutch button text)
- Billing settings page integration
