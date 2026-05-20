export const TIERS = ["visitor", "free", "vip"] as const;
export type Tier = (typeof TIERS)[number];

// Tiers that require a paid checkout flow.
export const PAID_TIERS = ["vip"] as const satisfies readonly Tier[];
export type PaidTier = (typeof PAID_TIERS)[number];

export function isPaidTier(t: string): t is PaidTier {
  return (PAID_TIERS as readonly string[]).includes(t);
}

// Indonesian Rupiah (IDR) checkout amount per paid tier (annual).
export const TIER_PRICE_IDR: Record<PaidTier, number> = {
  vip: 17_500_000,
};

// Hourly request budget per tier for tier-gated APIs (consult LLM, etc.).
// TODO(limits): placeholders — tune with actual usage data + LLM cost model.
export const TIER_RATE_LIMIT_HOURLY: Record<Tier, number> = {
  visitor: 5,
  free: 20,
  vip: 100,
};
