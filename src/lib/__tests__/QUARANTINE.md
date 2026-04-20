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

They are not behavioural tests — they `fs.readFileSync` source files (e.g. `prisma/schema.prisma`, React component source) and do substring matches for specific fields, Dutch strings, and exact whitespace. They fail when the schema/component drifts even if the behaviour is still correct. They were written for planned features (scheduled report delivery, assurance subscription tier) that didn't land in the shape the test expected.

## What to do

Either:
1. Re-implement them as real behavioural tests (import the module and test its output), or
2. Delete them once the schema/components have stabilised.

They are not deleted outright to preserve the intent (a future dev may want to re-implement coverage for those features).

Rename `.quarantined` → `.ts` to re-enable.
