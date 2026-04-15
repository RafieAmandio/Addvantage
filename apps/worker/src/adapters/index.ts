import type { SourceAdapter } from "./base";
import { FredAdapter } from "./fred";
import { SlickChartsAdapter } from "./slickcharts";
import { SpdjiAdapter } from "./spdji";
import { YardeniAdapter } from "./yardeni";
import { RbcAdapter } from "./rbc";

/** Ordered registry. The scheduler iterates this list on each tick. */
export const ADAPTERS: SourceAdapter[] = [
  new FredAdapter(),
  new SlickChartsAdapter(),
  new SpdjiAdapter(),
  new YardeniAdapter(),
  new RbcAdapter(),
];

export function getAdapter(code: string): SourceAdapter | undefined {
  return ADAPTERS.find((a) => a.code === code);
}
