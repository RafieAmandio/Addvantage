import type { UnlocksData } from "@/features/unlocks/types";

function inDays(n: number): string {
  return new Date(Date.now() + n * 86400000).toISOString();
}

// Offline-dev fixtures (NEXT_PUBLIC_MOCK_MODE=1), shaped like the live
// 2026-07 dry run against DefiLlama + CoinGecko.
export const unlocksFixture: UnlocksData = {
  updatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  trackedTop200: 71,
  horizonDays: 90,
  minPctSupply: 4.9,
  events: [
    {
      geckoId: "rain",
      unlockAt: inDays(3),
      symbol: "RAIN",
      name: "Rain",
      mcapRank: 13,
      tokens: 50_600_000_000,
      pctSupply: 8.8,
      usdValue: 755_500_000,
      price: 0.0149,
      categories: ["insiders", "ecosystem"],
      recipients: [
        { recipient: "Team & Advisors", category: "insiders", amount: 30_000_000_000 },
        { recipient: "Ecosystem Growth", category: "ecosystem", amount: 20_600_000_000 },
      ],
    },
    {
      geckoId: "pump-fun",
      unlockAt: inDays(4),
      symbol: "PUMP",
      name: "Pump",
      mcapRank: 92,
      tokens: 48_200_000_000,
      pctSupply: 13.5,
      usdValue: 144_400_000,
      price: 0.003,
      categories: ["ecosystem"],
      recipients: [
        { recipient: "Community & Ecosystem", category: "ecosystem", amount: 48_200_000_000 },
      ],
    },
    {
      geckoId: "rain",
      unlockAt: inDays(34),
      symbol: "RAIN",
      name: "Rain",
      mcapRank: 13,
      tokens: 36_200_000_000,
      pctSupply: 6.3,
      usdValue: 540_900_000,
      price: 0.0149,
      categories: ["insiders"],
      recipients: [
        { recipient: "Team & Advisors", category: "insiders", amount: 36_200_000_000 },
      ],
    },
    {
      geckoId: "plasma",
      unlockAt: inDays(79),
      symbol: "XPL",
      name: "Plasma",
      mcapRank: 141,
      tokens: 2_500_000_000,
      pctSupply: 69.4,
      usdValue: 190_900_000,
      price: 0.076,
      categories: ["insiders", "ecosystem", "liquidity"],
      recipients: [
        { recipient: "Investors", category: "insiders", amount: 1_500_000_000 },
        { recipient: "Ecosystem", category: "ecosystem", amount: 1_000_000_000 },
      ],
    },
    {
      geckoId: "doublezero",
      unlockAt: inDays(86),
      symbol: "2Z",
      name: "DoubleZero",
      mcapRank: 147,
      tokens: 3_600_000_000,
      pctSupply: 47.7,
      usdValue: 120_100_000,
      price: 0.033,
      categories: ["insiders"],
      recipients: [
        { recipient: "Core Contributors", category: "insiders", amount: 3_600_000_000 },
      ],
    },
  ],
};
