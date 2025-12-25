-- Google Health & Visibility Score System
-- VexNexa Internal Scoring: 0-1000 based on Google APIs

-- 1. Google Search Console Daily Site Metrics
CREATE TABLE IF NOT EXISTS gsc_daily_site_metrics (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  site_url TEXT NOT NULL,
  clicks INTEGER NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  ctr DECIMAL(10, 6) NOT NULL DEFAULT 0,
  position DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, site_url)
);

CREATE INDEX IF NOT EXISTS idx_gsc_site_date ON gsc_daily_site_metrics(date DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_site_url_date ON gsc_daily_site_metrics(site_url, date DESC);

-- 2. Google Search Console Daily Query Metrics (top N per day)
CREATE TABLE IF NOT EXISTS gsc_daily_query_metrics (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  site_url TEXT NOT NULL,
  query TEXT NOT NULL,
  clicks INTEGER NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  ctr DECIMAL(10, 6) NOT NULL DEFAULT 0,
  position DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, site_url, query)
);

CREATE INDEX IF NOT EXISTS idx_gsc_query_date ON gsc_daily_query_metrics(date DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_query_impressions ON gsc_daily_query_metrics(date DESC, impressions DESC);

-- 3. Google Search Console Daily Page Metrics (top N per day)
CREATE TABLE IF NOT EXISTS gsc_daily_page_metrics (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  site_url TEXT NOT NULL,
  page TEXT NOT NULL,
  clicks INTEGER NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  ctr DECIMAL(10, 6) NOT NULL DEFAULT 0,
  position DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, site_url, page)
);

CREATE INDEX IF NOT EXISTS idx_gsc_page_date ON gsc_daily_page_metrics(date DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_page_impressions ON gsc_daily_page_metrics(date DESC, impressions DESC);

-- 4. GA4 Daily Landing Page Metrics
CREATE TABLE IF NOT EXISTS ga4_daily_landing_metrics (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  property_id TEXT NOT NULL,
  landing_page TEXT NOT NULL,
  organic_sessions INTEGER NOT NULL DEFAULT 0,
  engaged_sessions INTEGER NOT NULL DEFAULT 0,
  engagement_rate DECIMAL(10, 6) NOT NULL DEFAULT 0,
  avg_engagement_time_seconds DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_users INTEGER NOT NULL DEFAULT 0,
  returning_users INTEGER NOT NULL DEFAULT 0,
  events_per_session DECIMAL(10, 2) NOT NULL DEFAULT 0,
  conversions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, property_id, landing_page)
);

CREATE INDEX IF NOT EXISTS idx_ga4_landing_date ON ga4_daily_landing_metrics(date DESC);
CREATE INDEX IF NOT EXISTS idx_ga4_landing_sessions ON ga4_daily_landing_metrics(date DESC, organic_sessions DESC);

-- 5. PageSpeed Insights Daily Metrics (optional)
CREATE TABLE IF NOT EXISTS pagespeed_daily_metrics (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  url TEXT NOT NULL,
  strategy VARCHAR(20) NOT NULL, -- 'mobile' or 'desktop'
  performance_score DECIMAL(5, 2) NOT NULL DEFAULT 0,
  lcp DECIMAL(10, 2), -- Largest Contentful Paint (ms)
  cls DECIMAL(10, 6), -- Cumulative Layout Shift
  inp DECIMAL(10, 2), -- Interaction to Next Paint (ms)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, url, strategy)
);

CREATE INDEX IF NOT EXISTS idx_pagespeed_date ON pagespeed_daily_metrics(date DESC);
CREATE INDEX IF NOT EXISTS idx_pagespeed_url ON pagespeed_daily_metrics(url, date DESC);

-- 6. Daily Score (0-1000)
CREATE TABLE IF NOT EXISTS score_daily (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  total_score INTEGER NOT NULL DEFAULT 0, -- 0-1000
  p1_index_crawl_health DECIMAL(10, 2) NOT NULL DEFAULT 0, -- 0-250
  p2_search_visibility DECIMAL(10, 2) NOT NULL DEFAULT 0, -- 0-250
  p3_engagement_intent DECIMAL(10, 2) NOT NULL DEFAULT 0, -- 0-200
  p4_content_performance DECIMAL(10, 2) NOT NULL DEFAULT 0, -- 0-200
  p5_technical_experience DECIMAL(10, 2) NOT NULL DEFAULT 0, -- 0-100
  breakdown JSONB DEFAULT '{}', -- detailed scoring components
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_score_date ON score_daily(date DESC);

-- 7. Score Actions (recommended improvements)
CREATE TABLE IF NOT EXISTS score_actions_daily (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  pillar VARCHAR(50) NOT NULL, -- P1-P5
  key VARCHAR(100) NOT NULL, -- unique action key
  severity VARCHAR(20) NOT NULL, -- 'critical', 'high', 'medium', 'low'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact_points INTEGER NOT NULL DEFAULT 0, -- estimated points gain
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, pillar, key)
);

CREATE INDEX IF NOT EXISTS idx_actions_date ON score_actions_daily(date DESC);
CREATE INDEX IF NOT EXISTS idx_actions_severity ON score_actions_daily(date DESC, severity);

-- 8. Alerts
CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  severity VARCHAR(20) NOT NULL, -- 'critical', 'high', 'medium', 'low'
  type VARCHAR(100) NOT NULL, -- alert type identifier
  entity_type VARCHAR(50), -- 'score', 'pillar', 'page', etc.
  entity_key TEXT, -- specific entity identifier
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'acknowledged', 'resolved'
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type, created_at DESC);

-- 9. Alert Rules
CREATE TABLE IF NOT EXISTS alert_rules (
  id SERIAL PRIMARY KEY,
  type VARCHAR(100) NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT true,
  thresholds JSONB DEFAULT '{}',
  lookback_days INTEGER DEFAULT 7,
  severity VARCHAR(20) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default alert rules
INSERT INTO alert_rules (type, enabled, thresholds, lookback_days, severity, description)
VALUES
  ('SCORE_DROP_7D', true, '{"min_drop": 60}', 7, 'high', 'Total score dropped >= 60 points vs 7-day average'),
  ('PILLAR_DROP', true, '{"min_pct_drop": 0.25}', 7, 'medium', 'Any pillar dropped >= 25% vs 7-day average'),
  ('INDEX_403_SPIKE', true, '{"min_pct_increase": 0.5, "min_absolute": 10}', 7, 'high', '403 errors increased >= 50% or absolute > 10'),
  ('VISIBILITY_IMPRESSIONS_DROP', true, '{"min_pct_drop": 0.25}', 7, 'high', 'Impressions dropped >= 25% vs 7-day average'),
  ('CTR_ANOMALY', true, '{"min_impressions": 500, "ctr_ratio": 0.5}', 7, 'medium', 'CTR ratio < 0.5 on pages with >= 500 impressions'),
  ('FUNNEL_CONV_DROP', true, '{"min_pct_drop": 0.3}', 7, 'high', 'Conversion rate dropped >= 30% vs 7-day average')
ON CONFLICT (type) DO NOTHING;

-- 10. Watched Pages (for monitoring specific URLs)
CREATE TABLE IF NOT EXISTS watched_pages (
  id SERIAL PRIMARY KEY,
  page_path TEXT NOT NULL UNIQUE,
  label TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_watched_pages_enabled ON watched_pages(enabled, page_path);

-- Update triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_gsc_site_updated_at BEFORE UPDATE ON gsc_daily_site_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gsc_query_updated_at BEFORE UPDATE ON gsc_daily_query_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gsc_page_updated_at BEFORE UPDATE ON gsc_daily_page_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ga4_landing_updated_at BEFORE UPDATE ON ga4_daily_landing_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pagespeed_updated_at BEFORE UPDATE ON pagespeed_daily_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_score_daily_updated_at BEFORE UPDATE ON score_daily FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alert_rules_updated_at BEFORE UPDATE ON alert_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_watched_pages_updated_at BEFORE UPDATE ON watched_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
