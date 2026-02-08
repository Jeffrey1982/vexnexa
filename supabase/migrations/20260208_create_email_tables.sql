-- Email logs: one row per sent message
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text,
  to_email text NOT NULL,
  subject text NOT NULL,
  tag text,
  mailgun_message_id text,
  mailgun_api_id text,
  status text NOT NULL DEFAULT 'sent',
  last_event_type text,
  last_event_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON email_logs (to_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_tag ON email_logs (tag);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs (status);
CREATE INDEX IF NOT EXISTS idx_email_logs_mailgun_message_id ON email_logs (mailgun_message_id);

-- Email events: one row per Mailgun webhook event
CREATE TABLE IF NOT EXISTS email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mailgun_message_id text,
  event_type text NOT NULL,
  severity text,
  reason text,
  recipient text,
  occurred_at timestamptz NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_events_occurred_at ON email_events (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_events_mailgun_message_id ON email_events (mailgun_message_id);
CREATE INDEX IF NOT EXISTS idx_email_events_event_type ON email_events (event_type);
