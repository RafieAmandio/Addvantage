/**
 * Route-symbol → canonical BarsAdapter symbol mapping.
 *
 * The route param for `/app/chart/[symbol]` is a short user-facing code
 * (`SPX`, `BTC`, `ETH`, `DXY`, `GOLD`). The worker BarsAdapter contract
 * (`apps/worker/src/adapters/bars/base.ts`) expects canonical forms — slash-
 * separated quote currency for FX/crypto, XAU/USD for gold. Keep the mapping
 * in one place so web (listBars) and future admin screens agree.
 */
export type RouteSymbol = "SPX" | "BTC" | "ETH" | "DXY" | "GOLD";

const ROUTE_TO_CANONICAL: Record<RouteSymbol, string> = {
  SPX: "SPX",
  BTC: "BTC/USD",
  ETH: "ETH/USD",
  DXY: "DXY",
  GOLD: "XAU/USD",
};

export function routeSymbolToCanonical(symbol: RouteSymbol): string {
  return ROUTE_TO_CANONICAL[symbol];
}
