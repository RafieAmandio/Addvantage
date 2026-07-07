export interface UnlockRecipient {
  recipient: string;
  category: string;
  amount: number;
}

export interface UnlockEvent {
  geckoId: string;
  unlockAt: string;
  symbol: string;
  name: string;
  mcapRank: number;
  tokens: number;
  pctSupply: number;
  usdValue: number;
  price: number;
  categories: string[];
  recipients: UnlockRecipient[];
}

export interface UnlocksData {
  updatedAt: string | null;
  trackedTop200: number;
  horizonDays: number;
  minPctSupply: number;
  events: UnlockEvent[];
}

export function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
}

export function compactUsd(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}
