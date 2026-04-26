# Quarantined tests

The following test files were salvaged from older agent worktrees and were failing against the current codebase:

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

## Current status

| File | Decision |
|------|----------|
| `admin-selection.test.ts.quarantined` | Keep quarantined until admin selection has component-level tests that render the UI. |
| `admin-user-settings.test.ts.quarantined` | Keep quarantined until admin settings has behavioural route/component coverage. |
| `assurance-scheduling.test.ts.quarantined` | Keep quarantined; feature shape differs from the planned source-string test. |
| `assurance-subscribe.test.ts.quarantined` | Keep quarantined; feature shape differs from the planned source-string test. |
| `billing-tax.test.ts.quarantined` | Keep quarantined; useful intent, but should be reworked around the tax engine or billing route behaviour. |
| `change-plan-dialog.test.ts.quarantined` | Keep quarantined until component rendering tests cover plan-change flows. |
| `vat-display.test.ts.quarantined` | Keep quarantined until UI rendering tests cover VAT display behaviour. |

Two active skip blocks were reworked instead of quarantined:

- `coupon-system.test.ts` now uses Prisma DMMF for schema assertions.
- `tax-rules.test.ts` now uses Prisma DMMF for checkout quote schema assertions.

They are not deleted outright to preserve the intent for future behavioural coverage. Rename `.quarantined` to `.ts` only after rewriting the assertions around rendered UI, route behaviour, or library output.
