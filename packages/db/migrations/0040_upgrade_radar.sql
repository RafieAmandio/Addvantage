-- Upgrade Radar tool — upcoming network-upgrade catalysts (hard forks, mainnet
-- launches, protocol releases/updates, testnets, burns, token swaps) for top-200
-- mcap coins. Sourced from CoinMarketCal (scraped via CloakBrowser by the
-- upgrade-scraper container) + CoinGecko ranks. VIP-only surface: RLS enabled
-- with NO public read policy — service-role access only (same as token_unlocks).

CREATE TABLE IF NOT EXISTS upgrade_events (
  event_id      BIGINT PRIMARY KEY,        -- CoinMarketCal event id (stable natural key)
  coin_gecko_id TEXT,                        -- resolved via symbol join to CoinGecko
  symbol        TEXT NOT NULL,
  name          TEXT NOT NULL,               -- coin name from CoinGecko
  mcap_rank     INT NOT NULL,
  title         TEXT NOT NULL,               -- event title
  category      TEXT NOT NULL,               -- normalized: hard-fork|mainnet|release|update|testnet|burn
  cmc_category  TEXT NOT NULL,               -- raw CoinMarketCal category (e.g. "Fork/Swap")
  impact        TEXT,                        -- high|medium|low (nullable — only scored events)
  impact_score  NUMERIC,                     -- 0-10 (nullable)
  date_start    TIMESTAMPTZ(6) NOT NULL,
  date_approx   BOOLEAN NOT NULL DEFAULT false,  -- true when only month/~countdown known
  display_date  TEXT NOT NULL,               -- human string: "29 Jul", "IN ~3MO", "Jul 2026"
  source        TEXT NOT NULL,               -- CoinMarketCal event URL (the proof link)
  coin_icon     TEXT,                        -- coin logo url
  fetched_at    TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX upgrade_events_date_start_idx ON upgrade_events (date_start);

ALTER TABLE upgrade_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS upgrade_events_meta (
  id             INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  tracked_top200 INT NOT NULL,
  synced_at      TIMESTAMPTZ(6) NOT NULL
);

ALTER TABLE upgrade_events_meta ENABLE ROW LEVEL SECURITY;
