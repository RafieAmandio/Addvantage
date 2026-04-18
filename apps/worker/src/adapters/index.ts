import type { SourceAdapter } from "./base";
import { FredAdapter } from "./fred";
import { SlickChartsAdapter } from "./slickcharts";
import { SpdjiAdapter } from "./spdji";
import { YardeniAdapter } from "./yardeni";
import { RbcAdapter } from "./rbc";
import { TruthSocialAdapter } from "./truth-social";

/** Ordered registry. The scheduler iterates this list on each tick. */
export const ADAPTERS: SourceAdapter[] = [
  new FredAdapter(),
  new SlickChartsAdapter(),
  new SpdjiAdapter(),
  new YardeniAdapter(),
  new RbcAdapter(),
  new TruthSocialAdapter(),
];

export function getAdapter(code: string): SourceAdapter | undefined {
  return ADAPTERS.find((a) => a.code === code);
}
