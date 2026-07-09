"""
Entrypoint for the Upgrade Radar scraper container.
Boot-runs once, then loops every SYNC_INTERVAL_HOURS (default 12h). Set RUN_ONCE=1
to scrape a single time and exit (useful for cron-style scheduling or testing).
"""
import os
import sys
import time
import traceback

from scraper import scrape_events, normalize
from sync import write_events


def run_once() -> int:
    events = scrape_events()
    print(f"scraped {len(events)} raw events", flush=True)
    catalysts = normalize(events)
    print(f"{len(catalysts)} upgrade catalysts within horizon", flush=True)
    return write_events(catalysts)


def main():
    interval_h = float(os.environ.get("SYNC_INTERVAL_HOURS", "12"))
    run_once_only = os.environ.get("RUN_ONCE") == "1"

    while True:
        started = time.time()
        try:
            n = run_once()
            print(f"sync complete: {n} events in {time.time()-started:.1f}s", flush=True)
        except Exception as e:
            print(f"sync FAILED: {e}", file=sys.stderr, flush=True)
            traceback.print_exc()
        if run_once_only:
            break
        time.sleep(interval_h * 3600)


if __name__ == "__main__":
    main()
