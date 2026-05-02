# Removed legacy test drafts

The following test files were salvaged from older agent worktrees, quarantined, and later removed because they were failing against the current codebase:

- `admin-selection.test.ts.quarantined`
- `admin-user-settings.test.ts.quarantined`
- `assurance-scheduling.test.ts.quarantined`
- `assurance-subscribe.test.ts.quarantined`
- `billing-tax.test.ts.quarantined`
- `change-plan-dialog.test.ts.quarantined`
- `vat-display.test.ts.quarantined`

## Why quarantined

They are not behavioural tests. They read source files such as `prisma/schema.prisma` or React component source and then do substring matches for specific fields, Dutch strings, and exact whitespace. They fail when the schema/component drifts even if the behaviour is still correct.

Several were written for planned features such as scheduled report delivery and assurance subscription tiers that did not land in the exact shape the tests expected.

## Replacement intent

| File | Decision |
|------|----------|
| `admin-selection.test.ts.quarantined` | Replace with component-level tests that render the admin selection UI. |
| `admin-user-settings.test.ts.quarantined` | Replace with behavioural route/component coverage for admin settings. |
| `assurance-scheduling.test.ts.quarantined` | Replace with tests around the implemented scheduling behaviour. |
| `assurance-subscribe.test.ts.quarantined` | Replace with tests around the implemented subscription flow. |
| `billing-tax.test.ts.quarantined` | Replace with tests around the tax engine or billing route behaviour. |
| `change-plan-dialog.test.ts.quarantined` | Replace with component rendering tests for plan-change flows. |
| `vat-display.test.ts.quarantined` | Replace with UI rendering tests for VAT display behaviour. |

Two active skip blocks were reworked instead of quarantined:

- `coupon-system.test.ts` now uses Prisma DMMF for schema assertions.
- `tax-rules.test.ts` now uses Prisma DMMF for checkout quote schema assertions.

Recreate these as `.test.ts` / `.test.tsx` only after rewriting the assertions around rendered UI, route behaviour, or library output.
