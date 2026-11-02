// Presentation helpers shared by the calendar list and the event page: currency and flag,
// beat or miss against the forecast, related markets and a plain "why it matters" line.
import type { CalendarEvent } from "@/features/calendar/types";

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  US: "USD", EU: "EUR", DE: "EUR", UK: "GBP", GB: "GBP", JP: "JPY",
  CN: "CNY", ID: "IDR", AU: "AUD", CA: "CAD", IN: "INR", CH: "CHF", NZ: "NZD",
};

const FLAG: Record<string, string> = {
  USD: "🇺🇸", EUR: "🇪🇺", GBP: "🇬🇧", JPY: "🇯🇵", CNY: "🇨🇳", IDR: "🇮🇩", AUD: "🇦🇺",
  CAD: "🇨🇦", INR: "🇮🇳", CHF: "🇨🇭", NZD: "🇳🇿", OIL: "🛢️",
};

/**
 * Currency for an event. `code` is the title prefix ("USD" or "US") or the region.
 * Rows tagged GLOBAL carry the country in the name (RBA, NZ, OPEC+).
 */
export function currencyOf(code: string, title: string): string {
  const c = code.toUpperCase();
  if (FLAG[c]) return c;
  if (COUNTRY_TO_CURRENCY[c]) return COUNTRY_TO_CURRENCY[c];
  if (/\bOPEC|crude|oil\b/i.test(title)) return "OIL";
  if (/\bRBA\b|^AU\b|Australia/i.test(title)) return "AUD";
  if (/\bRBNZ\b|^NZ\b|New Zealand/i.test(title)) return "NZD";
  if (/\bBoC\b|^CA\b|Canada/i.test(title)) return "CAD";
  if (/\bSNB\b|Swiss/i.test(title)) return "CHF";
  return "Other";
}

export const flagOf = (cur: string) => FLAG[cur] ?? "🌐";

/** "USD — CPI YoY" or a plain title plus its region, as currency, flag and the bare name. */
export function eventLabel(title: string, code: string) {
  const [prefix, ...rest] = title.split(" — ");
  const name = rest.length ? rest.join(" — ") : title;
  const cur = currencyOf(rest.length ? prefix! : code, name);
  return { cur, flag: flagOf(cur), name };
}

export const labelOf = (e: CalendarEvent) => eventLabel(e.title, e.region);

/** "51.2", "-1.4M", "$92.4B", "4.75%" to a number; null when there is none. */
export function num(v: string | undefined | null): number | null {
  if (!v) return null;
  const m = v.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

/** Releases where a lower print is the good news for the currency. */
export const lowerIsBetter = (name: string) => /unemployment|jobless|claims/i.test(name);

/** Beat or miss against the forecast: "up" is good for the currency, "down" is bad. */
export function surpriseTone(
  name: string,
  actual: string | undefined,
  forecast: string | undefined,
): "up" | "down" | null {
  const a = num(actual);
  const f = num(forecast);
  if (a === null || f === null || a === f) return null;
  return a > f !== lowerIsBetter(name) ? "up" : "down";
}

/** Actual minus forecast, keeping the unit and decimals of the forecast. */
export function surpriseText(actual: string | undefined, forecast: string | undefined): string | null {
  const a = num(actual);
  const f = num(forecast);
  if (a === null || f === null) return null;
  const decimals = Math.max(...[actual, forecast].map((s) => s!.split(".")[1]?.match(/^\d+/)?.[0].length ?? 0));
  const d = a - f;
  const unit = forecast!.match(/(%|K|M|B|T)$/)?.[1] ?? "";
  return `${d > 0 ? "+" : d < 0 ? "-" : ""}${Math.abs(d).toFixed(decimals)}${unit}`;
}

/** Instruments a release usually moves, first one is the reaction pair. */
const RELATED: Record<string, string[]> = {
  USD: ["EUR/USD", "USD/JPY", "XAU/USD", "DXY", "SPX"],
  EUR: ["EUR/USD", "EUR/GBP", "DAX", "STOXX50E"],
  GBP: ["GBP/USD", "EUR/GBP", "FTSE"],
  JPY: ["USD/JPY", "EUR/JPY", "GBP/JPY"],
  CNY: ["AUD/USD", "NZD/USD", "HG1"],
  IDR: ["USD/IDR", "XAU/USD", "AUD/USD"],
  AUD: ["AUD/USD", "AUD/JPY", "AUD/NZD"],
  NZD: ["NZD/USD", "AUD/NZD"],
  CAD: ["USD/CAD", "WTI/USD"],
  CHF: ["USD/CHF", "EUR/CHF"],
  OIL: ["WTI/USD", "USD/CAD"],
};
export const relatedSymbols = (cur: string) => RELATED[cur] ?? ["EUR/USD", "XAU/USD"];

/** Strip the reference period so this month's release matches last month's. */
export const seriesKey = (name: string) =>
  name
    .replace(/\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC|Q[1-4])\b/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const WHY: Array<[RegExp, string]> = [
  [/payrolls|employment change/i, "Jobs growth is the clearest read on the economy's momentum. A strong print pushes back rate cuts and supports the currency; a weak one does the opposite. Revisions to the prior months can matter as much as the headline."],
  [/unemployment/i, "Slack in the labour market. A rising rate says the economy is cooling and argues for easier policy, which weighs on the currency."],
  [/jobless claims/i, "The most timely weekly read on layoffs. One print is noise; a trend higher in claims is an early warning for payrolls."],
  [/jolts|job openings/i, "Labour demand. Fewer openings mean less wage pressure, which the central bank reads as disinflationary."],
  [/hourly earnings/i, "Wage growth feeds services inflation. A hot print is hawkish even when the jobs number is soft."],
  [/core pce|pce/i, "The Fed's preferred inflation gauge. Markets usually price it from CPI and PPI first, so the surprise tends to be small but it sets the tone for rate expectations."],
  [/cpi|inflation/i, "Inflation is the central bank's target. A hot print pushes rate cuts further out and lifts yields and the currency; a soft print does the opposite. Core usually matters more than headline."],
  [/ppi/i, "Prices at the factory gate. It leads consumer inflation and feeds the PCE estimate."],
  [/rate decision|interest rate|cash rate|deposit facility|bi rate|fomc/i, "The policy rate itself is usually priced. The move comes from the statement, the vote split and the guidance on the next meeting."],
  [/speech|testimony|press conference/i, "No number, but the tone can reprice the next rate decision. Watch for any change in language on inflation or the labour market."],
  [/gdp/i, "The broadest measure of growth. Advance and preliminary prints move markets most; final revisions rarely do."],
  [/pmi|ism/i, "A survey of purchasing managers. Above 50 is expansion, below 50 is contraction. It is the earliest monthly read on activity, and the prices paid component feeds inflation expectations."],
  [/retail sales|spending/i, "Consumer spending drives most of growth. A strong print supports the currency and pushes yields higher."],
  [/sentiment|confidence|ifo|zew/i, "A survey of how households or firms feel. It leads spending and investment, but the market reaction is usually modest unless the surprise is large."],
  [/trade balance|current account/i, "Exports minus imports. It matters most for export driven economies and for the commodity currencies tied to them."],
  [/crude|inventories/i, "Weekly US oil stocks. A larger draw than expected is bullish for crude and for the oil linked currencies."],
  [/opec/i, "Output policy from the main producers. A surprise change in supply is the biggest scheduled risk for crude."],
  [/industrial production|factory orders|productivity/i, "Output from the industrial side of the economy. A secondary release that rarely moves price on its own."],
];

export const whyItMatters = (name: string) =>
  WHY.find(([re]) => re.test(name))?.[1] ??
  "A scheduled release that can move the currency when it surprises the forecast.";
