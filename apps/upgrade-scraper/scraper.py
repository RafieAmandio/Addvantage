"""
Upgrade Radar scraper — pulls network-upgrade catalysts from CoinMarketCal
(hard forks, mainnets, releases, upgrades, swaps, burns) using CloakBrowser to
clear Cloudflare Turnstile, joins to the CoinGecko top-200, and writes them to
the upgrade_events table. Runs as its own container so the headless browser is
isolated from the web/api/worker services.

Env:
  DATABASE_URL             (required)  Postgres connection (Supabase pooler ok)
  CLOAKBROWSER_LICENSE_KEY (optional)  Pro binary; free binary used if unset
  SCRAPER_PROXY            (optional)  http://user:pass@host:port — set if the
                                       datacenter IP gets Cloudflare-blocked
  COINGECKO_API_KEY        (optional)  raises CoinGecko rate limits
  RUN_ONCE                 (optional)  "1" = scrape once and exit (default: loop)
  MAX_LOAD_MORE            (optional)  load-more clicks (default 8)
"""
import os
import re
import sys
import time
import json
import datetime as dt

CMC_URL = "https://coinmarketcal.com/en/"
COINGECKO_MARKETS = (
    "https://api.coingecko.com/api/v3/coins/markets"
    "?vs_currency=usd&order=market_cap_desc&per_page=250&page=1"
)
TOP_N = 200
HORIZON_DAYS = 90

# Raw CoinMarketCal category -> normalized catalyst category. Only these count
# as network-upgrade catalysts; everything else (Tokenomics, Staking, Exchange,
# Partnership, Airdrop, Community, AMA, Conference...) is dropped.
CATEGORY_MAP = {
    "fork/swap": "hard-fork",
    "release": "release",
    "mainnet": "mainnet",
    "testnet": "testnet",
    "update": "update",
    "burn": "burn",
}

# In-card JS extractor. Returns one record per event card.
EXTRACT_JS = r"""
() => {
  const CATS = ["Fork/Swap","Release","Mainnet","Testnet","Update","Burn",
                "Tokenomics","Staking/Farming","Exchange","Partnership",
                "Airdrop","Community","AMA","Conference","Other"];
  const out = [];
  for (const a of document.querySelectorAll("a[href*='/event/']")) {
    const href = a.getAttribute("href") || "";
    const m = href.match(/-(\d+)-\d+$/);
    if (!m) continue;
    const id = m[1];
    const title = (a.getAttribute("aria-label") || a.querySelector("h3")?.innerText || "").trim();
    const img = a.querySelector("img[alt]");
    const symbol = img ? (img.getAttribute("alt") || "").trim() : "";
    const coinIcon = img ? img.getAttribute("src") : null;
    // category: first span whose exact text is a known category
    let category = null;
    for (const s of a.querySelectorAll("span,div")) {
      const t = (s.textContent || "").trim();
      if (CATS.includes(t)) { category = t; break; }
    }
    // impact: the block styled with --impact-* ; text is High/Medium/Low + score
    let impact = null, score = null;
    const imp = a.querySelector("[style*='--impact']");
    if (imp) {
      const parts = (imp.innerText || "").split(/\s+/).filter(Boolean);
      for (const p of parts) {
        if (/^(High|Medium|Low)$/i.test(p)) impact = p.toLowerCase();
        else if (/^\d+(\.\d+)?$/.test(p)) score = parseFloat(p);
      }
    }
    // countdown ("in 4d" / "in ~22d") and displayDate ("13 Jul" / "Jul 2026")
    const spans = Array.from(a.querySelectorAll("span")).map(s => (s.innerText||"").trim());
    const countdown = spans.find(t => /^in\s/i.test(t)) || spans.find(t => /ongoing/i.test(t)) || "";
    const displayDate = spans.find(t => /^\d{1,2}\s+[A-Za-z]{3}/.test(t) || /^[A-Za-z]{3}\s+\d{4}/.test(t)) || "";
    out.push({ id, title, symbol, coinIcon, category, impact, score, countdown, displayDate, href });
  }
  // dedupe by id
  const seen = new Set(); const uniq = [];
  for (const e of out) { if (!seen.has(e.id)) { seen.add(e.id); uniq.push(e); } }
  return uniq;
}
"""


def scrape_events():
    from cloakbrowser import launch
    # Turnstile is far more reliable in headed mode (per CloakBrowser docs). In
    # Docker we run headed under xvfb (HEADED=1); native/dev can stay headless.
    headed = os.environ.get("HEADED") == "1"
    kwargs = {"headless": not headed, "humanize": True}
    proxy = os.environ.get("SCRAPER_PROXY")
    if proxy:
        kwargs["proxy"] = proxy
    lic = os.environ.get("CLOAKBROWSER_LICENSE_KEY")
    if lic:
        kwargs["license_key"] = lic

    if os.environ.get("NO_SANDBOX") == "1":
        kwargs["args"] = ["--no-sandbox", "--disable-dev-shm-usage"]
    browser = launch(**kwargs)
    try:
        page = browser.new_page()
        page.goto(CMC_URL, wait_until="domcontentloaded", timeout=60000)
        # Poll for the Turnstile challenge to auto-clear (managed challenge can
        # take several seconds); give up to ~30s before declaring a block.
        cleared = False
        for _ in range(15):
            page.wait_for_timeout(2000)
            title = page.title().lower()
            body = page.inner_text("body")[:200].lower() if page.query_selector("body") else ""
            if "just a moment" not in title and "security verification" not in body:
                cleared = True
                break
        if not cleared:
            raise RuntimeError("Cloudflare block not cleared (try HEADED=1 / SCRAPER_PROXY with a residential IP)")

        max_clicks = int(os.environ.get("MAX_LOAD_MORE", "8"))
        for _ in range(max_clicks):
            btn = page.query_selector(
                "xpath=//button[contains(translate(., 'abcdefghijklmnopqrstuvwxyz','ABCDEFGHIJKLMNOPQRSTUVWXYZ'),'LOAD MORE')]"
            )
            if not btn:
                break
            try:
                btn.scroll_into_view_if_needed(timeout=3000)
                btn.click()
                page.wait_for_timeout(2500)
            except Exception:
                break

        return page.evaluate(EXTRACT_JS)
    finally:
        browser.close()


def parse_countdown_days(countdown: str):
    """'in 4d' -> (4, False); 'in ~22d' -> (22, True); 'ongoing' -> (0, False)."""
    c = countdown.lower().strip()
    if "ongoing" in c:
        return 0, False
    approx = "~" in c
    m = re.search(r"(\d+)\s*d", c)
    if m:
        return int(m.group(1)), approx
    mo = re.search(r"(\d+)\s*mo", c)
    if mo:
        return int(mo.group(1)) * 30, True
    w = re.search(r"(\d+)\s*w", c)
    if w:
        return int(w.group(1)) * 7, approx
    return None, True


def normalize(events):
    """Attach normalized category + a computed date_start; drop non-catalysts."""
    today = dt.datetime.now(dt.timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    out = []
    for e in events:
        cat_raw = (e.get("category") or "").strip()
        norm = CATEGORY_MAP.get(cat_raw.lower())
        if not norm:
            continue  # not an upgrade catalyst
        days, approx = parse_countdown_days(e.get("countdown") or "")
        if days is None:
            continue
        if days < -1 or days > HORIZON_DAYS:
            continue
        date_start = today + dt.timedelta(days=max(days, 0))
        sym = (e.get("symbol") or "").upper()
        if not sym or not re.fullmatch(r"[A-Z0-9]{1,10}", sym):
            continue
        out.append({
            "event_id": int(e["id"]),
            "symbol": sym,
            "title": e.get("title") or "Network upgrade",
            "category": norm,
            "cmc_category": cat_raw,
            "impact": e.get("impact"),
            "impact_score": e.get("score"),
            "date_start": date_start,
            "date_approx": approx,
            "display_date": (e.get("displayDate") or e.get("countdown") or "").strip(),
            "source": "https://coinmarketcal.com" + e["href"],
            "coin_icon": e.get("coinIcon"),
        })
    return out


def main():
    dry = "--dry-run" in sys.argv
    events = scrape_events()
    print(f"scraped {len(events)} raw events", file=sys.stderr)
    catalysts = normalize(events)
    print(f"{len(catalysts)} upgrade catalysts within {HORIZON_DAYS}d", file=sys.stderr)
    if dry:
        print(json.dumps(catalysts, indent=2, default=str))
        return
    # DB write handled by sync.py in the container entrypoint
    from sync import write_events
    write_events(catalysts)


if __name__ == "__main__":
    main()
