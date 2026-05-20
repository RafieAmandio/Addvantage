export type ForexGroup = "major" | "cross" | "commodity" | "exotic" | "index";

export interface ForexPair {
  symbol: string;
  label: string;
  group: ForexGroup;
}

export const FOREX_PAIRS: ForexPair[] = [
  // Majors
  { symbol: "EUR/USD", label: "Euro / US Dollar", group: "major" },
  { symbol: "USD/JPY", label: "US Dollar / Yen", group: "major" },
  { symbol: "GBP/USD", label: "Pound / US Dollar", group: "major" },
  { symbol: "USD/CHF", label: "US Dollar / Swiss Franc", group: "major" },
  { symbol: "AUD/USD", label: "Aussie / US Dollar", group: "major" },
  { symbol: "USD/CAD", label: "US Dollar / Canadian", group: "major" },
  { symbol: "NZD/USD", label: "Kiwi / US Dollar", group: "major" },

  // Crosses
  { symbol: "EUR/GBP", label: "Euro / Pound", group: "cross" },
  { symbol: "EUR/JPY", label: "Euro / Yen", group: "cross" },
  { symbol: "EUR/AUD", label: "Euro / Aussie", group: "cross" },
  { symbol: "EUR/CAD", label: "Euro / Canadian", group: "cross" },
  { symbol: "EUR/CHF", label: "Euro / Swiss Franc", group: "cross" },
  { symbol: "EUR/NZD", label: "Euro / Kiwi", group: "cross" },
  { symbol: "GBP/JPY", label: "Pound / Yen", group: "cross" },
  { symbol: "GBP/AUD", label: "Pound / Aussie", group: "cross" },
  { symbol: "GBP/CHF", label: "Pound / Swiss Franc", group: "cross" },
  { symbol: "GBP/CAD", label: "Pound / Canadian", group: "cross" },
  { symbol: "GBP/NZD", label: "Pound / Kiwi", group: "cross" },
  { symbol: "AUD/JPY", label: "Aussie / Yen", group: "cross" },
  { symbol: "AUD/NZD", label: "Aussie / Kiwi", group: "cross" },
  { symbol: "CAD/JPY", label: "Canadian / Yen", group: "cross" },
  { symbol: "NZD/JPY", label: "Kiwi / Yen", group: "cross" },
  { symbol: "CHF/JPY", label: "Swiss Franc / Yen", group: "cross" },

  // Commodities
  { symbol: "XAU/USD", label: "Gold", group: "commodity" },
  { symbol: "XAG/USD", label: "Silver", group: "commodity" },
  { symbol: "XAU/EUR", label: "Gold / Euro", group: "commodity" },
  { symbol: "WTI/USD", label: "Crude Oil WTI", group: "commodity" },

  // Exotics
  { symbol: "USD/SGD", label: "US Dollar / Singapore", group: "exotic" },
  { symbol: "USD/MXN", label: "US Dollar / Mexican Peso", group: "exotic" },
  { symbol: "USD/ZAR", label: "US Dollar / South African Rand", group: "exotic" },
  { symbol: "USD/TRY", label: "US Dollar / Turkish Lira", group: "exotic" },
  { symbol: "USD/THB", label: "US Dollar / Thai Baht", group: "exotic" },
  { symbol: "EUR/PLN", label: "Euro / Polish Zloty", group: "exotic" },
  { symbol: "USD/HKD", label: "US Dollar / Hong Kong Dollar", group: "exotic" },

  // Indices
  { symbol: "SPX", label: "S&P 500", group: "index" },
  { symbol: "NDX", label: "Nasdaq 100", group: "index" },
  { symbol: "DJI", label: "Dow Jones", group: "index" },
  { symbol: "DXY", label: "US Dollar Index", group: "index" },
  { symbol: "FTSE", label: "FTSE 100", group: "index" },
  { symbol: "DAX", label: "DAX 40", group: "index" },
];

export const FOREX_SYMBOLS = FOREX_PAIRS.map((p) => p.symbol);

export const RSI_INTERVALS = ["1h", "4h", "1day"] as const;
export type RsiInterval = (typeof RSI_INTERVALS)[number];

export const RSI_ZONES = [
  { id: "overbought", label: "OVERBOUGHT", min: 70, max: 100, color: "#E03C3C" },
  { id: "strong", label: "STRONG", min: 60, max: 70, color: "#ef5350" },
  { id: "neutral", label: "NEUTRAL", min: 40, max: 60, color: "#6B7280" },
  { id: "weak", label: "WEAK", min: 30, max: 40, color: "#65A30D" },
  { id: "oversold", label: "OVERSOLD", min: 0, max: 30, color: "#22c55e" },
] as const;

export type RsiZoneId = (typeof RSI_ZONES)[number]["id"];

export function classifyRsi(rsi: number): RsiZoneId {
  if (rsi >= 70) return "overbought";
  if (rsi >= 60) return "strong";
  if (rsi >= 40) return "neutral";
  if (rsi >= 30) return "weak";
  return "oversold";
}
