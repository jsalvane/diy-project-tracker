-- Price Alerts table for tracking gift prices
CREATE TABLE price_alerts (
  id                   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  gift_id              TEXT NOT NULL REFERENCES gifts(id) ON DELETE CASCADE,
  url                  TEXT NOT NULL,
  label                TEXT DEFAULT '',
  target_price         NUMERIC(10,2) NOT NULL,
  current_price        NUMERIC(10,2),
  lowest_price         NUMERIC(10,2),
  last_checked         TIMESTAMPTZ,
  last_alerted         TIMESTAMPTZ,
  consecutive_failures INTEGER DEFAULT 0,
  is_active            BOOLEAN DEFAULT TRUE,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON price_alerts FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_price_alerts_gift_id ON price_alerts(gift_id);
CREATE INDEX idx_price_alerts_active ON price_alerts(is_active) WHERE is_active = TRUE;
