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
