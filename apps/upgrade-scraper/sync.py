"""
CoinGecko top-200 join + Postgres writer for the Upgrade Radar scraper.
Keeps only scraped catalysts whose coin is in the CoinGecko top-200 (by symbol),
then delete-and-replaces the upgrade_events table in one transaction.
"""
import os
import re
import json
import urllib.request
import datetime as dt

import psycopg2
import psycopg2.extras

COINGECKO_MARKETS = (
    "https://api.coingecko.com/api/v3/coins/markets"
    "?vs_currency=usd&order=market_cap_desc&per_page=250&page=1"
)
TOP_N = 200


def _db_url() -> str:
    url = os.environ["DATABASE_URL"]
    # libpq rejects the pgbouncer flag Supabase adds to pooler URLs.
    return re.sub(r"[?&]pgbouncer=true", "", url)


def fetch_top200():
    """symbol(upper) -> {rank, name, gecko_id}, best rank on collision."""
    headers = {"User-Agent": "tradevantage-scraper"}
    key = os.environ.get("COINGECKO_API_KEY")
    if key:
        headers["x-cg-demo-api-key"] = key
    req = urllib.request.Request(COINGECKO_MARKETS, headers=headers)
    with urllib.request.urlopen(req, timeout=30) as r:
        data = json.load(r)
    by_symbol = {}
    for m in data:
        rank = m.get("market_cap_rank")
        if rank is None or rank > TOP_N:
            continue
        sym = (m.get("symbol") or "").upper()
        if not sym:
            continue
        cur = by_symbol.get(sym)
        if cur is None or rank < cur["rank"]:
            by_symbol[sym] = {"rank": rank, "name": m.get("name") or sym, "gecko_id": m.get("id")}
    return by_symbol


def write_events(catalysts):
    top200 = fetch_top200()

    rows = []
    tracked = set()
    for c in catalysts:
        market = top200.get(c["symbol"])
        if not market:
            continue  # not a top-200 coin
        tracked.add(c["symbol"])
        rows.append((
            c["event_id"], market["gecko_id"], c["symbol"], market["name"], market["rank"],
            c["title"], c["category"], c["cmc_category"], c.get("impact"), c.get("impact_score"),
            c["date_start"], c["date_approx"], c["display_date"], c["source"], c.get("coin_icon"),
        ))

    conn = psycopg2.connect(_db_url())
    try:
        conn.autocommit = False
        with conn.cursor() as cur:
            cur.execute("DELETE FROM upgrade_events")
            if rows:
                psycopg2.extras.execute_values(
                    cur,
                    """INSERT INTO upgrade_events
                       (event_id, coin_gecko_id, symbol, name, mcap_rank, title, category,
                        cmc_category, impact, impact_score, date_start, date_approx,
                        display_date, source, coin_icon)
                       VALUES %s
                       ON CONFLICT (event_id) DO NOTHING""",
                    rows,
                )
            cur.execute(
                """INSERT INTO upgrade_events_meta (id, tracked_top200, synced_at)
                   VALUES (1, %s, %s)
                   ON CONFLICT (id) DO UPDATE
                     SET tracked_top200 = EXCLUDED.tracked_top200,
                         synced_at = EXCLUDED.synced_at""",
                (len(tracked), dt.datetime.now(dt.timezone.utc)),
            )
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

    print(f"wrote {len(rows)} top-200 catalysts ({len(tracked)} coins tracked)", flush=True)
    return len(rows)
