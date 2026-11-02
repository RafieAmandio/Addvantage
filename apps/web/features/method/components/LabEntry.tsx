import { FOREX_PAIRS } from "@tradevantage/shared";
import { getBoard } from "../queries";
import { loadMarket } from "../actions";
import { rankRows, sameSymbol } from "../lib/board";
import { LabWorkspace } from "./LabWorkspace";

/** Server half of the Chart Lab: the ranked markets for the picker and the first market's candles. */
export async function LabEntry({ symbol }: { symbol?: string }) {
  const rows = rankRows(await getBoard());
  // A symbol in the URL wins; otherwise the board's top market.
  const pick = (symbol && FOREX_PAIRS.find((p) => sameSymbol(p.symbol, symbol))?.symbol) || rows[0]?.symbol || FOREX_PAIRS[0]!.symbol;
  const bars = (await loadMarket(pick)) ?? { hourly: [], daily: [] };
  return <LabWorkspace rows={rows} initial={{ symbol: pick, ...bars }} explicit={!!symbol} />;
}
