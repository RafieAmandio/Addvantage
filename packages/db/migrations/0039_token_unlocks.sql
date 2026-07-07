-- Token Unlocks tool — upcoming cliff unlock events for top-200 mcap coins.
-- Synced ~every 12h by the worker from DefiLlama emissionsIndex + CoinGecko
-- ranks. Rows are stored from pct_supply >= 2 (buffer band); the API serves
-- only > 4.9% within 90 days. VIP-only surface: RLS enabled with NO public
-- read policy — service-role access only (unlike gap_snapshots).

CREATE TABLE IF NOT EXISTS token_unlocks (
  gecko_id    TEXT NOT NULL,
  unlock_at   TIMESTAMPTZ(6) NOT NULL,
  symbol      TEXT NOT NULL,
  name        TEXT NOT NULL,
  mcap_rank   INT NOT NULL,
  tokens      NUMERIC NOT NULL,
  pct_supply  NUMERIC NOT NULL,
  usd_value   NUMERIC NOT NULL,
  price       NUMERIC NOT NULL,
  circ_supply NUMERIC NOT NULL,
  categories  TEXT[] NOT NULL DEFAULT '{}',
  recipients  JSONB NOT NULL DEFAULT '[]',
  fetched_at  TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  PRIMARY KEY (gecko_id, unlock_at)
);

CREATE INDEX token_unlocks_unlock_at_idx ON token_unlocks (unlock_at);

ALTER TABLE token_unlocks ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS token_unlocks_meta (
  id             INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  tracked_top200 INT NOT NULL,
  synced_at      TIMESTAMPTZ(6) NOT NULL
);

ALTER TABLE token_unlocks_meta ENABLE ROW LEVEL SECURITY;
