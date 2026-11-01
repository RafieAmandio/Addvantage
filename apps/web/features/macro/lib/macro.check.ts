// Self-check for the macro helpers: npx tsx features/macro/lib/macro.check.ts
import type { AtrPair } from "@/features/atr/types";
import { currencyStrength, moveKind, oddsSplit, pairLegs } from "./macro";

const mk = (symbol: string, open: number, price: number) => ({ symbol, dailyOpen: open, price, dailyClose: price }) as AtrPair;
const s = currencyStrength([mk("EUR/USD", 1, 1.01), mk("USD/JPY", 100, 99), mk("XAU/USD", 1, 2)]);
console.assert(s.length === 3, "metals skipped");
console.assert(s.at(-1)!.ccy === "USD" && Math.abs(s.at(-1)!.score + 1) < 1e-9, "USD weakest at -1%");
console.assert(moveKind("25 bps increase") === "hike" && moveKind("No Change") === "hold" && moveKind("50+ bps decrease") === "cut", "moveKind");
const split = oddsSplit({ title: "", meetingDate: "", volume: 0, url: "", outcomes: [{ label: "No change", p: 0.7 }, { label: "25 bps decrease", p: 0.2 }, { label: "50+ bps decrease", p: 0.1 }] });
console.assert(split.hold === 0.7 && Math.abs(split.cut - 0.3) < 1e-9, "oddsSplit");
console.assert(pairLegs("EURUSD")?.join() === "EUR,USD" && pairLegs("XAUUSD") === null, "pairLegs");
console.log("macro lib ok");
