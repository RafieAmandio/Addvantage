import type { UpgradeRadarData } from "@/features/upgrades/types";

function inDays(n: number): string {
  return new Date(Date.now() + n * 86400000).toISOString();
}

// Offline-dev fixtures (NEXT_PUBLIC_MOCK_MODE=1), shaped like the real
// CoinMarketCal scrape joined to CoinGecko top-200 ranks.
export const upgradeRadarFixture: UpgradeRadarData = {
  updatedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
  trackedTop200: 9,
  horizonDays: 90,
  events: [
    {
      id: "85944708", geckoId: "dash", symbol: "DASH", name: "Dash", mcapRank: 111,
      title: "Private Tx Mainnet", category: "release", cmcCategory: "Release",
      impact: "medium", impactScore: 6.5, dateStart: inDays(3), dateApprox: true,
      displayDate: "IN ~3D", source: "https://coinmarketcal.com/event/private-tx-mainnet-85944708-1",
      coinIcon: null,
    },
    {
      id: "53620797", geckoId: "jito-governance-token", symbol: "JTO", name: "Jito", mcapRank: 130,
      title: "JTX Launch", category: "release", cmcCategory: "Release",
      impact: null, impactScore: null, dateStart: inDays(5), dateApprox: false,
      displayDate: "14 Jul", source: "https://coinmarketcal.com/event/jtx-launch-53620797-1",
      coinIcon: null,
    },
    {
      id: "33198222", geckoId: "zcash", symbol: "ZEC", name: "Zcash", mcapRank: 15,
      title: "Ironwood Activation", category: "release", cmcCategory: "Release",
      impact: "high", impactScore: 8.0, dateStart: inDays(12), dateApprox: true,
      displayDate: "IN ~12D", source: "https://coinmarketcal.com/event/ironwood-upgrade-33198222-2",
      coinIcon: null,
    },
    {
      id: "68673027", geckoId: "blockstack", symbol: "STX", name: "Stacks", mcapRank: 133,
      title: "Bitcoin Staking Fork", category: "hard-fork", cmcCategory: "Fork/Swap",
      impact: "high", impactScore: 8.0, dateStart: inDays(20), dateApprox: false,
      displayDate: "29 Jul", source: "https://coinmarketcal.com/event/bitcoin-staking-fork-68673027-1",
      coinIcon: null,
    },
    {
      id: "14769805", geckoId: "algorand", symbol: "ALGO", name: "Algorand", mcapRank: 79,
      title: "Native PQ Accounts", category: "release", cmcCategory: "Release",
      impact: null, impactScore: null, dateStart: inDays(60), dateApprox: true,
      displayDate: "IN ~2MO", source: "https://coinmarketcal.com/event/native-pq-accounts-14769805-1",
      coinIcon: null,
    },
    {
      id: "18156535", geckoId: "tron", symbol: "TRX", name: "TRON", mcapRank: 8,
      title: "Quantum Mainnet", category: "release", cmcCategory: "Release",
      impact: "high", impactScore: 7.5, dateStart: inDays(88), dateApprox: true,
      displayDate: "IN ~3MO", source: "https://coinmarketcal.com/event/quantum-mainnet-18156535-2",
      coinIcon: null,
    },
  ],
};
