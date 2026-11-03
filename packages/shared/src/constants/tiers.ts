// `crypto`: the Black Friday free plan. Crypto tools and news only, see canOpenRoute.
export const TIERS = ["visitor", "free", "crypto", "vip"] as const;
export type Tier = (typeof TIERS)[number];

// Tiers that require a paid checkout flow.
export const PAID_TIERS = ["vip"] as const satisfies readonly Tier[];
export type PaidTier = (typeof PAID_TIERS)[number];

export function isPaidTier(t: string): t is PaidTier {
  return (PAID_TIERS as readonly string[]).includes(t);
}

// Indonesian Rupiah (IDR) checkout amount per paid tier (annual).
export const TIER_PRICE_IDR: Record<PaidTier, number> = {
  vip: 18_000_000,
};

// Hourly request budget per tier for tier-gated APIs (consult LLM, etc.).
// TODO(limits): placeholders — tune with actual usage data + LLM cost model.
export const TIER_RATE_LIMIT_HOURLY: Record<Tier, number> = {
  visitor: 5,
  free: 20,
  crypto: 20,
  vip: 100,
};

// Routes only VIP opens (the sidebar's PRO items). Everything else is open to `free`.
const VIP_ROUTES = ["/app/plan", "/app/consult", "/app/unlocks", "/app/upgrades"];
// The whole of what a `crypto` account opens: crypto tools, news and account basics.
const CRYPTO_ROUTES = ["/app/news", "/app/unlocks", "/app/upgrades", "/app/settings", "/app/subscription"];

const under = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}/`);

/**
 * The one answer to "can this tier open this /app route". Used by the sidebar, the page guards
 * and the API's tier checks (which pass the route their data backs). Admins are handled by callers.
 */
export function canOpenRoute(tier: string, path: string): boolean {
  if (tier === "vip") return true;
  if (tier === "crypto") return CRYPTO_ROUTES.some((r) => under(path, r));
  return !VIP_ROUTES.some((r) => under(path, r));
}
