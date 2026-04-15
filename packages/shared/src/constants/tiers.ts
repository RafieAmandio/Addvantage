export const TIERS = ["visitor", "free", "vip"] as const;
export type Tier = (typeof TIERS)[number];
