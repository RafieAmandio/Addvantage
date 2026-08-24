export type ForexGroup = "major" | "cross" | "commodity" | "index";
export type ForexTier = "primary" | "secondary" | "thirdliner";

export interface ForexPair {
  symbol: string;
  label: string;
  group: ForexGroup;
  tier: ForexTier;
}

export const FOREX_PAIRS: ForexPair[] = [
  // ── Primary ────────────────────────────────────────────────────────
  // Majors
  { symbol: "EUR/USD", label: "Euro / US Dollar", group: "major", tier: "primary" },
  { symbol: "GBP/USD", label: "Pound / US Dollar", group: "major", tier: "primary" },
  { symbol: "AUD/USD", label: "Aussie / US Dollar", group: "major", tier: "primary" },
  { symbol: "NZD/USD", label: "Kiwi / US Dollar", group: "major", tier: "primary" },
  { symbol: "USD/CHF", label: "US Dollar / Swiss Franc", group: "major", tier: "primary" },
  { symbol: "USD/JPY", label: "US Dollar / Yen", group: "major", tier: "primary" },
  { symbol: "USD/CAD", label: "US Dollar / Canadian", group: "major", tier: "primary" },
  // Cross in primary
  { symbol: "GBP/JPY", label: "Pound / Yen", group: "cross", tier: "primary" },
  // Commodities
  { symbol: "XAU/USD", label: "Gold", group: "commodity", tier: "primary" },
  { symbol: "XAG/USD", label: "Silver", group: "commodity", tier: "primary" },
  { symbol: "HG1", label: "Copper", group: "commodity", tier: "primary" },
  { symbol: "WTI/USD", label: "Crude Oil WTI", group: "commodity", tier: "primary" },
  // Indices
  { symbol: "SPX", label: "S&P 500", group: "index", tier: "primary" },
  { symbol: "NDX", label: "Nasdaq 100", group: "index", tier: "primary" },
  { symbol: "STOXX50E", label: "Euro Stoxx 50", group: "index", tier: "primary" },
  { symbol: "FTSE", label: "UK 100", group: "index", tier: "primary" },
  { symbol: "FCHI", label: "CAC 40", group: "index", tier: "primary" },

  // ── Secondary ──────────────────────────────────────────────────────
  { symbol: "AUD/JPY", label: "Aussie / Yen", group: "cross", tier: "secondary" },
  { symbol: "EUR/JPY", label: "Euro / Yen", group: "cross", tier: "secondary" },
  { symbol: "EUR/GBP", label: "Euro / Pound", group: "cross", tier: "secondary" },

  // ── Thirdliner (higher risk) ───────────────────────────────────────
  // Remaining crosses
  { symbol: "EUR/AUD", label: "Euro / Aussie", group: "cross", tier: "thirdliner" },
  { symbol: "EUR/CAD", label: "Euro / Canadian", group: "cross", tier: "thirdliner" },
  { symbol: "EUR/CHF", label: "Euro / Swiss Franc", group: "cross", tier: "thirdliner" },
  { symbol: "EUR/NZD", label: "Euro / Kiwi", group: "cross", tier: "thirdliner" },
  { symbol: "GBP/AUD", label: "Pound / Aussie", group: "cross", tier: "thirdliner" },
  { symbol: "GBP/CHF", label: "Pound / Swiss Franc", group: "cross", tier: "thirdliner" },
  { symbol: "GBP/CAD", label: "Pound / Canadian", group: "cross", tier: "thirdliner" },
  { symbol: "GBP/NZD", label: "Pound / Kiwi", group: "cross", tier: "thirdliner" },
  { symbol: "AUD/NZD", label: "Aussie / Kiwi", group: "cross", tier: "thirdliner" },
  { symbol: "CAD/JPY", label: "Canadian / Yen", group: "cross", tier: "thirdliner" },
  { symbol: "NZD/JPY", label: "Kiwi / Yen", group: "cross", tier: "thirdliner" },
  { symbol: "CHF/JPY", label: "Swiss Franc / Yen", group: "cross", tier: "thirdliner" },
  // Remaining commodities
  { symbol: "XAU/EUR", label: "Gold / Euro", group: "commodity", tier: "thirdliner" },
  // Remaining indices
  { symbol: "DJI", label: "Dow Jones", group: "index", tier: "thirdliner" },
  { symbol: "DXY", label: "US Dollar Index", group: "index", tier: "thirdliner" },
  { symbol: "DAX", label: "DAX 40", group: "index", tier: "thirdliner" },
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

// ── ATR Daily Levels ──────────────────────────────────────────────

export const ATR_PERIOD = 20;

export const ATR_ZONES = [
  { id: "exceeded", label: "EXCEEDED", min: 100, max: Infinity, color: "#FF6B35" },
  { id: "critical", label: "CRITICAL", min: 75, max: 100, color: "#FFD400" },
  { id: "high", label: "HIGH", min: 50, max: 75, color: "#D4A017" },
  { id: "moderate", label: "MODERATE", min: 25, max: 50, color: "#8B8B8B" },
  { id: "fresh", label: "FRESH", min: 0, max: 25, color: "#4B6A88" },
] as const;

export type AtrZoneId = (typeof ATR_ZONES)[number]["id"];

export function classifyAtrExhaustion(pct: number): AtrZoneId {
  if (pct >= 100) return "exceeded";
  if (pct >= 75) return "critical";
  if (pct >= 50) return "high";
  if (pct >= 25) return "moderate";
  return "fresh";
}
