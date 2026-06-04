-- Monday Gap Fill Screener snapshots
CREATE TABLE IF NOT EXISTS gap_snapshots (
  symbol        TEXT NOT NULL,
  friday_close  NUMERIC NOT NULL,
  monday_open   NUMERIC NOT NULL,
  current_price NUMERIC,
  gap_pct       NUMERIC NOT NULL,
  gap_direction TEXT NOT NULL CHECK (gap_direction IN ('UP', 'DOWN')),
  fill_pct      NUMERIC NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'filled', 'expired')),
  week_start    DATE NOT NULL,
  ts            TIMESTAMPTZ(6) NOT NULL,
  fetched_at    TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  PRIMARY KEY (symbol, week_start)
);

ALTER TABLE gap_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gap_snapshots_public_read" ON gap_snapshots FOR SELECT USING (true);
