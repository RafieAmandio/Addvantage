import type { SourceAdapter } from "./base";
import { FredAdapter } from "./fred";
import { SlickChartsAdapter } from "./slickcharts";
import { SpdjiAdapter } from "./spdji";
import { YardeniAdapter } from "./yardeni";
import { RbcAdapter } from "./rbc";
import { TruthSocialAdapter } from "./truth-social";
import { ForexFactoryAdapter } from "./forexfactory";
import { MktNewsAdapter } from "./mktnews";
import { KobeissiAdapter } from "./kobeissi/adapter";
// TradingEconomics is a calendar adapter, not a news adapter — see calendar/tradingeconomics.ts

/** Ordered registry. The scheduler iterates this list on each tick. */
export const ADAPTERS: SourceAdapter[] = [
  new FredAdapter(),
  new SlickChartsAdapter(),
  new SpdjiAdapter(),
  new YardeniAdapter(),
  new RbcAdapter(),
  new TruthSocialAdapter(),
  new ForexFactoryAdapter(),
  new MktNewsAdapter(),
  new KobeissiAdapter(),
];

export function getAdapter(code: string): SourceAdapter | undefined {
  return ADAPTERS.find((a) => a.code === code);
}
