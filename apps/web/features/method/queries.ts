import { FOREX_PAIRS, boardRow, type BoardRow } from "@tradevantage/shared";
import { apiGet } from "@/lib/api/client-server";
import { isMockMode } from "@/lib/config/public";
import { listBars } from "@/features/chart/queries/bars";
import { toChartBars } from "@/features/chart/lib/bars";

const DAY = 86_400_000;

/** Every market's read from the API; in mock mode the same read runs here on real candles pulled for preview. */
export async function getBoard(): Promise<BoardRow[]> {
  if (!isMockMode()) return apiGet<{ rows: BoardRow[] }>("/method/board").then((d) => d.rows).catch(() => []);
  const now = Date.now();
  const rows = await Promise.all(
    FOREX_PAIRS.map(async (p) => {
      const [d, h] = await Promise.all([
        listBars({ symbol: p.symbol, interval: "1d", from: new Date(now - 200 * DAY), to: new Date(now) }),
        listBars({ symbol: p.symbol, interval: "1h", from: new Date(now - 14 * DAY), to: new Date(now) }),
      ]);
      const daily = toChartBars(d);
      return daily.length ? boardRow(p, daily, toChartBars(h)) : null;
    }),
  );
  return rows.filter((r): r is BoardRow => r !== null);
}
