import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  join(
    process.cwd(),
    'prisma/migrations/20260809090000_public_reports_fail_closed/migration.sql'
  ),
  'utf8'
).toLowerCase();

const productionMigration = readFileSync(
  join(process.cwd(), 'scripts/migrate-production.ts'),
  'utf8'
).toLowerCase();

describe('public report database defaults', () => {
  it('retains existing rows while disabling every public/indexing flag', () => {
    expect(migration).toContain('alter column is_public set default false');
    expect(migration).toContain('alter column allow_indexing set default false');
    expect(migration).toContain('alter column public_page_enabled set default false');
    expect(migration).toContain('set is_public = false');
    expect(migration).toContain('allow_indexing = false');
    expect(migration).toContain('public_page_enabled = false');
    expect(migration).toContain('latest_public_report_id = null');
    expect(migration).not.toMatch(/delete\s+from\s+public_scan_(sites|reports)/);
  });

  it('creates fresh public report tables with private defaults', () => {
    expect(productionMigration).toContain('"public_page_enabled" boolean not null default false');
    expect(productionMigration).toContain('"is_public" boolean not null default false');
    expect(productionMigration).toContain('"allow_indexing" boolean not null default false');
    expect(productionMigration).not.toContain('"public_page_enabled" boolean not null default true');
    expect(productionMigration).not.toContain('"is_public" boolean not null default true');
    expect(productionMigration).not.toContain('"allow_indexing" boolean not null default true');
  });

  it('also freezes and verifies existing production rows', () => {
    expect(productionMigration).toContain('update "public_scan_reports"');
    expect(productionMigration).toContain('set "is_public" = false');
    expect(productionMigration).toContain('"allow_indexing" = false');
    expect(productionMigration).toContain('update "public_scan_sites"');
    expect(productionMigration).toContain('set "public_page_enabled" = false');
    expect(productionMigration).toContain('"latest_public_report_id" = null');
    expect(productionMigration).toContain('public report freeze verification failed');
  });
});
