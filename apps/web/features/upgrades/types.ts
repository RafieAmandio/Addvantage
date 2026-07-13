export interface UpgradeEvent {
  id: string;
  geckoId: string | null;
  symbol: string;
  name: string;
  mcapRank: number;
  title: string;
  category: string;
  cmcCategory: string;
  impact: string | null;
  impactScore: number | null;
  dateStart: string;
  dateApprox: boolean;
  displayDate: string;
  source: string;
  coinIcon: string | null;
}

export interface UpgradeRadarData {
  updatedAt: string | null;
  trackedTop200: number;
  horizonDays: number;
  events: UpgradeEvent[];
}

export function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
}

// Human label for a normalized catalyst category.
const CATEGORY_LABELS: Record<string, string> = {
  "hard-fork": "HARD FORK",
  mainnet: "MAINNET",
  release: "RELEASE",
  update: "UPDATE",
  testnet: "TESTNET",
  burn: "BURN",
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category.toUpperCase();
}
