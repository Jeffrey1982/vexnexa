-- Align Google health tables with the admin SEO pages that read them.

ALTER TABLE ga4_daily_landing_metrics
  ADD COLUMN IF NOT EXISTS bounce_rate DECIMAL(10, 6) NOT NULL DEFAULT 0;

ALTER TABLE watched_pages
  ADD COLUMN IF NOT EXISTS url TEXT,
  ADD COLUMN IF NOT EXISTS active BOOLEAN,
  ADD COLUMN IF NOT EXISTS added_at TIMESTAMP WITH TIME ZONE;

UPDATE watched_pages
SET
  url = COALESCE(url, page_path),
  active = COALESCE(active, enabled),
  added_at = COALESCE(added_at, created_at);

CREATE INDEX IF NOT EXISTS idx_watched_pages_active_added
  ON watched_pages(active, added_at DESC);
