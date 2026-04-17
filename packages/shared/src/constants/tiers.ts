export const TIERS = ["visitor", "free", "vip"] as const;
export type Tier = (typeof TIERS)[number];

// Tiers that require a paid checkout flow.
export const PAID_TIERS = ["vip"] as const satisfies readonly Tier[];
export type PaidTier = (typeof PAID_TIERS)[number];

export function isPaidTier(t: string): t is PaidTier {
  return (PAID_TIERS as readonly string[]).includes(t);
}

// Indonesian Rupiah (IDR) checkout amount per paid tier.
// TODO(price): placeholders from tick 48 — confirm with user before live use.
export const TIER_PRICE_IDR: Record<PaidTier, number> = {
  vip: 199_000,
};
