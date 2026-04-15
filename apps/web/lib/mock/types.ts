export type Tier = "visitor" | "free" | "vip";

export type Hashtag =
  | "losing-streak"
  | "unprofitability"
  | "developing-edge"
  | "loss-aversion"
  | "recency-bias"
  | "sunk-cost"
  | "risk-management"
  | "mean-reversion"
  | "trend-following";

export type Impact = "high" | "medium" | "low";
export type Bias = "bullish" | "bearish" | "neutral";

export interface NewsItem {
  id: string;
  ts: string;          // ISO
  author: string;      // ANTS byline — never the original wire source
  headline: string;
  impact: Impact;
  bias: Bias;
  affects: string[];   // tickers / instruments
  analysis: string;    // "what this means for price"
  tags: Hashtag[];
  /** Optional: IDs of TradingPlans this news article directly informs. */
  relatedPlanIds?: string[];
}

/**
 * Per-currency impact scores, 0-9.
 * Fixed order: USD, EUR, GBP, JPY, CHF, CAD, AUD.
 * Higher = the event is expected to move that currency more.
 */
export type CurrencyScores = [number, number, number, number, number, number, number];

export interface CalendarEvent {
  id: string;
  ts: string;
  region: "US" | "EU" | "UK" | "JP" | "CN" | "ID" | "GLOBAL";
  title: string;          // "Non Farm Payrolls MAR"
  impact: Impact;         // mapped to High / Mod / Low for display
  scores: CurrencyScores;
  forecast?: string;
  previous?: string;
  notes?: string;
  /** Optional cross-reference: a NewsItem.id the desk wants linked from this row. */
  relatedNewsId?: string;
}

/**
 * Optional curated summary for a calendar day, keyed by YYYY-MM-DD (UTC).
 * If absent, the calendar page derives one from the day's events.
 */
export interface CalendarDayMeta {
  date: string;     // "2026-04-08"
  summary: string;  // "NFP + Unemployment"
}

export type SetupOutcome =
  | "live"         // in current plan, still running
  | "open"         // filled but not yet closed
  | "win"          // hit target(s), closed profitable
  | "loss"         // stopped / exited at loss
  | "stopped"      // stopped at invalidation
  | "invalidated"  // thesis broke, trade never taken or exited flat
  | "skipped";     // conditions never met, trade never taken

export interface TradingSetup {
  id: string;
  instrument: string;     // e.g. "ES1!", "BTCUSD"
  direction: "long" | "short";
  bias: Bias;
  entry: string;          // human-readable price band
  stop: string;
  targets: string[];
  invalidation: string;
  rationale: string;
  confidence: 1 | 2 | 3 | 4 | 5;
  tags: Hashtag[];
  outcome?: SetupOutcome;
  outcomeNotes?: string;  // "Hit T2 at 5,148, closed +1.8R"
  outcomeR?: string;      // e.g. "+1.8R", "-1R", "+0.4R"
}

export interface TradingPlan {
  id: string;
  date: string;
  horizon: "intraday" | "swing" | "weekly";
  thesis: string;
  setups: TradingSetup[];
  risks: string[];
  authoredBy: string;
}

export interface Primer {
  id: string;
  title: string;
  author: string;
  framework: string;       // "Kahneman & Tversky, 1979"
  summary: string;
  body: string[];          // paragraphs
  tags: Hashtag[];
  readingMin: number;
  locked: boolean;
}

export interface ConsultMessage {
  id: string;
  role: "user" | "ai" | "team";
  author?: string;          // for team messages
  ts: string;
  body: string;
  tags: Hashtag[];
}

export interface ConsultSession {
  id: string;
  title: string;
  startedAt: string;
  lastAt: string;
  messages: ConsultMessage[];
  tags: Hashtag[];
}

export interface ChannelPost {
  id: string;
  ts: string;
  author: string;
  body: string;
  tags: Hashtag[];
}

export interface User {
  id: string;
  handle: string;
  email: string;
  tier: Tier;
  signedLiability: boolean;
  joinedAt: string;
  renewsAt?: string;
  package?: string;
}

export interface Plan {
  id: string;
  name: string;
  priceIDR: number;
  cadence: "3-month";
  features: string[];
  highlight?: boolean;
}
