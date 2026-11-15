/** BTC Fear and Greed Index from alternative.me (free, no key, updates once a day). */
export interface FearGreedPoint {
  value: number;
  label: string;
  ts: number; // unix ms, start of the UTC day
}

const URL = "https://api.alternative.me/fng/?limit=31";
const TTL = 60 * 60_000;
// ponytail: per-process memo, the dashboard is force-dynamic so Next's fetch cache is off. Move to a worker table if instances multiply.
let memo: { at: number; data: FearGreedPoint[] } | null = null;
let inflight: Promise<void> | null = null;

// alternative.me can take 30s+ to answer, so a render never waits on it longer than WAIT.
function refresh(): Promise<void> {
  inflight ??= (async () => {
    try {
      const res = await fetch(URL, { cache: "no-store", signal: AbortSignal.timeout(45_000) });
      if (!res.ok) throw new Error(`fng HTTP ${res.status}`);
      const body = (await res.json()) as { data?: { value: string; value_classification: string; timestamp: string }[] };
      const data = (body.data ?? [])
        .map((d) => ({ value: Number(d.value), label: d.value_classification, ts: Number(d.timestamp) * 1000 }))
        .filter((d) => Number.isFinite(d.value) && Number.isFinite(d.ts));
      if (data.length) memo = { at: Date.now(), data };
    } catch {
      // keep the last good copy
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

const WAIT = 3000;

/** Newest first, up to 31 days. Serves the last good copy and refreshes it in the background. Empty until the first fetch lands. */
export async function getFearGreed(): Promise<FearGreedPoint[]> {
  if (!memo || Date.now() - memo.at > TTL) {
    const r = refresh();
    if (!memo) await Promise.race([r, new Promise((ok) => setTimeout(ok, WAIT))]);
  }
  return memo?.data ?? [];
}
