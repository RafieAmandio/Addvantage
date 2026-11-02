import type { AtrPair } from "@/features/atr/types";
import type { Ccy, MacroData } from "@/features/macro/types";
import { fmtPrice, dayChange } from "@/features/dashboard/components/PriceStrip";

/** Macro themes with an isometric figure in /public/consensus/{theme}.svg. */
export type Theme =
  | "bank"
  | "inflation"
  | "jobs"
  | "growth"
  | "gold"
  | "oil"
  | "fx"
  | "crypto"
  | "election"
  | "desk";

// First match wins, so specific themes go before the broad central-bank words ("rate", "cut").
const RULES: [Theme, RegExp][] = [
  ["crypto", /\b(bitcoin|btc|ethereum|eth|crypto|solana|sol)\b/],
  ["oil", /\b(oil|wti|brent|crude|opec)\b/],
  ["gold", /\b(gold|xau|silver|xag|copper|commodit\w*)\b/],
  ["inflation", /\b(cpi|inflation|pce|ppi)\b/],
  ["jobs", /\b(jobs?|payrolls?|nfp|unemployment|jobless)\b/],
  ["growth", /\b(recession|gdp|growth)\b/],
  ["bank", /\b(fed|fomc|ecb|boe|boj|rba|rbnz|boc|snb|rates?|cuts?|hikes?|bank of|central bank|powell)\b/],
  ["election", /\b(election|president\w*|senate|congress|vote|parliament|prime minister|party)\b/],
  ["fx", /\b(usd|eur|jpy|gbp|dollar|yen|euro|dxy|fx|currency)\b/],
];

export function themeOf(text: string): Theme {
  const t = text.toLowerCase();
  return RULES.find(([, re]) => re.test(t))?.[0] ?? "desk";
}

const BANKS: [Ccy, RegExp][] = [
  ["USD", /\b(fed|fomc|federal reserve|powell)\b/],
  ["EUR", /\b(ecb|european central)\b/],
  ["GBP", /\b(boe|bank of england)\b/],
  ["JPY", /\b(boj|bank of japan)\b/],
  ["AUD", /\b(rba|reserve bank of australia)\b/],
  ["NZD", /\b(rbnz)\b/],
  ["CAD", /\b(boc|bank of canada)\b/],
  ["CHF", /\b(snb|swiss national)\b/],
];

export interface Stat {
  label: string;
  value: string;
  sub?: string;
  tone?: "up" | "down";
}

// 3.875 keeps its third decimal, 2.5 reads 2.50.
const pct = (n: number) => `${n.toFixed(Number(n.toFixed(2)) === n ? 2 : 3)}%`;
const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

function bankStats(macro: MacroData, ccy: Ccy): Stat[] {
  const b = macro.banks[ccy];
  if (!b) return [];
  const out: Stat[] = [
    {
      label: b.bank === "Fed" ? "Fed funds" : `${b.bank} rate`,
      value: pct(b.rate),
      sub: b.lastChange ? `${b.lastChange > 0 ? "+" : ""}${Math.round(b.lastChange * 100)}bp ${b.lastChangeDate ? day(b.lastChangeDate) : ""}`.trim() : undefined,
      tone: b.lastChange ? (b.lastChange > 0 ? "up" : "down") : undefined,
    },
  ];
  if (b.odds?.meetingDate) out.push({ label: "Next decision", value: day(b.odds.meetingDate) });
  return out;
}

function priceStat(pairs: AtrPair[], symbols: string[], label: string): Stat | null {
  const p = pairs.find((x) => symbols.includes(x.symbol.replace("/", "")));
  if (!p) return null;
  const ch = dayChange(p);
  return { label, value: fmtPrice(p.price ?? p.dailyClose), sub: `${ch >= 0 ? "+" : ""}${ch.toFixed(2)}% today`, tone: ch >= 0 ? "up" : "down" };
}

function curveStat(macro: MacroData): Stat | null {
  const c = macro.usCurve;
  if (!c) return null;
  const bp = Math.round((c.y10 - c.y2) * 100);
  return { label: "US 2s10s", value: `${bp >= 0 ? "+" : ""}${bp}bp`, sub: bp >= 0 ? "Curve positive" : "Curve inverted" };
}

function vixStat(macro: MacroData): Stat | null {
  const v = macro.risk.vix;
  if (!v) return null;
  return {
    label: "VIX",
    value: v.v.toFixed(2),
    sub: v.change !== null ? `${v.change >= 0 ? "+" : ""}${v.change.toFixed(1)}% w/w` : undefined,
    tone: v.change !== null ? (v.change >= 0 ? "down" : "up") : undefined,
  };
}

/** One or two macro numbers that give a market its context, from the /app/macro data and the ATR prices. */
export function statsFor(theme: Theme, text: string, macro: MacroData, pairs: AtrPair[]): Stat[] {
  const t = text.toLowerCase();
  const ccy = BANKS.find(([, re]) => re.test(t))?.[0];
  const list: (Stat | null)[] =
    theme === "bank" ? bankStats(macro, ccy ?? "USD")
    : theme === "inflation" || theme === "jobs" ? [bankStats(macro, ccy ?? "USD")[0] ?? null, curveStat(macro)]
    : theme === "growth" ? [curveStat(macro), vixStat(macro)]
    : theme === "gold" ? [priceStat(pairs, ["XAUUSD"], "Gold spot"), bankStats(macro, "USD")[0] ?? null]
    : theme === "oil" ? [priceStat(pairs, ["WTIUSD", "USOIL", "WTI", "CL"], "WTI"), priceStat(pairs, ["BRENT", "UKOIL", "BZ"], "Brent")]
    : theme === "crypto" ? [priceStat(pairs, ["BTCUSD", "BTCUSDT"], "Bitcoin"), priceStat(pairs, ["ETHUSD", "ETHUSDT"], "Ether")]
    : theme === "fx" ? [priceStat(pairs, ["DXY"], "DXY") ?? priceStat(pairs, ["EURUSD"], "EURUSD"), vixStat(macro)]
    : [vixStat(macro)];
  return list.filter((s): s is Stat => s !== null).slice(0, 2);
}
