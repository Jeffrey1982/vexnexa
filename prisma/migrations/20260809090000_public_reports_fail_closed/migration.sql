-- Emergency fail-closed freeze for public accessibility reports.
--
-- This migration is intentionally non-destructive and therefore reversible:
-- report rows remain available for a future, individually reviewed opt-in
-- workflow. Do not bulk-enable them during rollback; restore only reports with
-- recorded publication consent and, for indexing, verified domain control.

DO $$
BEGIN
  IF to_regclass('public.public_scan_reports') IS NOT NULL THEN
    ALTER TABLE public.public_scan_reports
      ALTER COLUMN is_public SET DEFAULT false,
      ALTER COLUMN allow_indexing SET DEFAULT false;

    UPDATE public.public_scan_reports
    SET is_public = false,
        allow_indexing = false,
        updated_at = CURRENT_TIMESTAMP
    WHERE is_public = true OR allow_indexing = true;
  END IF;

  IF to_regclass('public.public_scan_sites') IS NOT NULL THEN
    ALTER TABLE public.public_scan_sites
      ALTER COLUMN public_page_enabled SET DEFAULT false;

    UPDATE public.public_scan_sites
    SET public_page_enabled = false,
        latest_public_report_id = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE public_page_enabled = true OR latest_public_report_id IS NOT NULL;
  END IF;
END $$;
