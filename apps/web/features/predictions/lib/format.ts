export function formatVolume(vol: number | null): string {
  if (vol === null || vol === 0) return "$0";
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(0)}K`;
  return `$${vol.toFixed(0)}`;
}

export function formatOdds(odds: number): string {
  if (odds <= 0) return "—";
  return `${odds.toFixed(2)}x`;
}

export function formatWeekRange(range: { min: number; max: number } | null): string | null {
  if (!range) return null;
  return `Last week: ${range.min}%–${range.max}%`;
}

const CATEGORY_ICONS: Record<string, string> = {
  CRYPTO: "₿",
  COMMODITIES: "⛢",
  EQUITIES: "◆",
  MACRO: "⚑",
};

export function categoryIcon(category: string): string {
  return CATEGORY_ICONS[category] ?? "◇";
}
