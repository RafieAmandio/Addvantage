import { z } from "zod";
import { prisma } from "@tradevantage/db";
import { config } from "../lib/config";
import { retry } from "../lib/retry";
import { logger } from "../lib/logger";

const COINGECKO_MARKETS =
  "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1";
const EMISSIONS_INDEX = "https://defillama-datasets.llama.fi/emissionsIndex";

const TOP_N = 200;
const HORIZON_DAYS = 90;
// Rows are stored from this floor so the display threshold (4.9%, applied in
// the API service) can be tuned without a resync.
const STORE_MIN_PCT = 2;

const MarketSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  market_cap_rank: z.number().nullable(),
  current_price: z.number().nullable(),
  circulating_supply: z.number().nullable(),
});

const AllocationSchema = z.object({
  recipient: z.string().optional(),
  category: z.string().optional(),
  amount: z.number().optional(),
});

const UnlockEventSchema = z.object({
  timestamp: z.number(),
  cliffAllocations: z.array(AllocationSchema).optional(),
  summary: z.object({ totalTokensCliff: z.number().optional() }).optional(),
});

const ProtocolSchema = z.object({
  name: z.string(),
  gecko_id: z.string().nullable().optional(),
  circSupply: z.number().nullable().optional(),
  tokenPrice: z
    .array(z.object({ price: z.number().optional(), symbol: z.string().optional() }))
    .optional(),
  unlockEvents: z.array(UnlockEventSchema).nullable().optional(),
});

interface UnlockRow {
  geckoId: string;
  unlockAt: Date;
  symbol: string;
  name: string;
  mcapRank: number;
  tokens: number;
  pctSupply: number;
  usdValue: number;
  price: number;
  circSupply: number;
  categories: string[];
  recipients: { recipient: string; category: string; amount: number }[];
}

async function fetchTop200() {
  const headers: Record<string, string> = { "User-Agent": "tradevantage-worker" };
  if (config.COINGECKO_API_KEY) headers["x-cg-demo-api-key"] = config.COINGECKO_API_KEY;

  const raw = await retry(
    async () => {
      const res = await fetch(COINGECKO_MARKETS, { headers });
      if (!res.ok) throw new Error(`coingecko: HTTP ${res.status}`);
      return (await res.json()) as unknown;
    },
    { label: "unlocks:coingecko", attempts: 3 },
  );

  const parsed = z.array(MarketSchema.passthrough()).safeParse(raw);
  if (!parsed.success) throw new Error(`coingecko: bad response shape: ${parsed.error.message}`);

  const byId = new Map<string, z.infer<typeof MarketSchema>>();
  for (const m of parsed.data) {
    if (m.market_cap_rank !== null && m.market_cap_rank <= TOP_N) byId.set(m.id, m);
  }
  return byId;
}

async function fetchEmissionsIndex() {
  const raw = await retry(
    async () => {
      const res = await fetch(EMISSIONS_INDEX);
      if (!res.ok) throw new Error(`emissionsIndex: HTTP ${res.status}`);
      return (await res.json()) as { data?: unknown[] };
    },
    { label: "unlocks:emissionsIndex", attempts: 3 },
  );
  if (!Array.isArray(raw.data)) throw new Error("emissionsIndex: missing data array");
  return raw.data;
}

export async function syncTokenUnlocks(): Promise<void> {
  const started = Date.now();
  logger.info("unlocks: sync starting");

  const [top200, index] = await Promise.all([fetchTop200(), fetchEmissionsIndex()]);

  const now = Date.now() / 1000;
  const horizon = now + HORIZON_DAYS * 86400;

  const rows: UnlockRow[] = [];
  const trackedGeckoIds = new Set<string>();

  for (const entry of index) {
    const parsed = ProtocolSchema.passthrough().safeParse(entry);
    if (!parsed.success) continue;
    const p = parsed.data;
    const geckoId = p.gecko_id;
    if (!geckoId) continue;
    const market = top200.get(geckoId);
    if (!market) continue;
    trackedGeckoIds.add(geckoId);

    const circSupply = market.circulating_supply || p.circSupply || 0;
    const price = market.current_price ?? p.tokenPrice?.[0]?.price ?? 0;
    if (!circSupply) continue;

    for (const ev of p.unlockEvents ?? []) {
      if (ev.timestamp < now || ev.timestamp > horizon) continue;
      const tokens = ev.summary?.totalTokensCliff ?? 0;
      if (tokens <= 0) continue;
      const pctSupply = (tokens / circSupply) * 100;
      if (pctSupply < STORE_MIN_PCT) continue;

      const allocations = (ev.cliffAllocations ?? [])
        .filter((a) => (a.amount ?? 0) > 0)
        .map((a) => ({
          recipient: a.recipient ?? "Unknown",
          category: a.category ?? "unknown",
          amount: a.amount ?? 0,
        }));

      rows.push({
        geckoId,
        unlockAt: new Date(ev.timestamp * 1000),
        symbol: market.symbol.toUpperCase(),
        name: market.name || p.name,
        mcapRank: market.market_cap_rank ?? 0,
        tokens,
        pctSupply,
        usdValue: tokens * price,
        price,
        circSupply,
        categories: [...new Set(allocations.map((a) => a.category))],
        recipients: allocations,
      });
    }
  }

  // Delete-and-replace inside one transaction: event sets shrink as dates
  // pass and schedules get revised, so stale rows must not survive.
  await prisma.$transaction(async (tx) => {
    await tx.tokenUnlock.deleteMany({});
    if (rows.length > 0) {
      await tx.tokenUnlock.createMany({
        data: rows.map((r) => ({
          geckoId: r.geckoId,
          unlockAt: r.unlockAt,
          symbol: r.symbol,
          name: r.name,
          mcapRank: r.mcapRank,
          tokens: r.tokens,
          pctSupply: r.pctSupply,
          usdValue: r.usdValue,
          price: r.price,
          circSupply: r.circSupply,
          categories: r.categories,
          recipients: r.recipients,
        })),
        skipDuplicates: true,
      });
    }
    await tx.tokenUnlocksMeta.upsert({
      where: { id: 1 },
      create: { id: 1, trackedTop200: trackedGeckoIds.size, syncedAt: new Date() },
      update: { trackedTop200: trackedGeckoIds.size, syncedAt: new Date() },
    });
  });

  logger.info(
    {
      rows: rows.length,
      above49: rows.filter((r) => r.pctSupply > 4.9).length,
      tracked: trackedGeckoIds.size,
      ms: Date.now() - started,
    },
    "unlocks: sync complete",
  );
}
