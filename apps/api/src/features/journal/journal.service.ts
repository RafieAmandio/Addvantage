import type { Prisma } from "@tradevantage/db";
import { NotFoundError } from "@/core/errors/index.js";
import { journalRepository as repo } from "./journal.repository.js";

type Row = NonNullable<Awaited<ReturnType<typeof repo.findTrade>>>;
const num = (d: Prisma.Decimal | null) => (d === null ? null : Number(d.toString()));

/** Decimals go out as numbers so the web can do maths on them. No rounding. */
function toTrade(r: Row) {
  return {
    id: r.id,
    symbol: r.symbol,
    side: r.side,
    setup: r.setup,
    timeframe: r.timeframe,
    status: r.status,
    entry: num(r.entry)!,
    stop: num(r.stop)!,
    target: num(r.target),
    exit: num(r.exit),
    size: num(r.size),
    riskPct: num(r.riskPct)!,
    openedAt: r.openedAt.toISOString(),
    closedAt: r.closedAt?.toISOString() ?? null,
    followedPlan: r.followedPlan,
    mistakes: r.mistakes,
    notes: r.notes,
    screenshotUrl: r.screenshotUrl,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

type TradeBody = Record<string, unknown> & { openedAt?: string; closedAt?: string | null };
const dates = (b: TradeBody) => ({
  ...b,
  ...(b.openedAt !== undefined ? { openedAt: new Date(b.openedAt) } : {}),
  ...(b.closedAt !== undefined ? { closedAt: b.closedAt === null ? null : new Date(b.closedAt) } : {}),
});
const day = (date: string) => new Date(`${date}T00:00:00.000Z`);

export const journalService = {
  listTrades: async (userId: string) => (await repo.listTrades(userId)).map(toTrade),

  createTrade: async (userId: string, body: TradeBody) =>
    toTrade(await repo.createTrade(userId, dates(body) as Omit<Prisma.JournalTradeUncheckedCreateInput, "userId">)),

  updateTrade: async (userId: string, id: string, body: TradeBody) => {
    if (!(await repo.findTrade(id, userId))) throw new NotFoundError("Trade not found");
    return toTrade(await repo.updateTrade(id, dates(body) as Prisma.JournalTradeUpdateInput));
  },

  deleteTrade: async (userId: string, id: string) => {
    const { count } = await repo.deleteTrade(id, userId);
    if (!count) throw new NotFoundError("Trade not found");
  },

  getSettings: async (userId: string) => {
    const s = await repo.getSettings(userId);
    return s ? { equity: num(s.equity)!, currency: s.currency, riskTier: num(s.riskTier)! } : { equity: 10000, currency: "USD", riskTier: 1.5 };
  },

  saveSettings: async (userId: string, body: { equity: number; currency: string; riskTier: number }) => {
    const s = await repo.upsertSettings(userId, body);
    return { equity: num(s.equity)!, currency: s.currency, riskTier: num(s.riskTier)! };
  },

  getPlan: async (userId: string, date: string) => {
    const p = await repo.getPlan(userId, day(date));
    return p ? { date, picks: p.picks, updatedAt: p.updatedAt.toISOString() } : null;
  },

  savePlan: async (userId: string, date: string, picks: Prisma.InputJsonValue) => {
    const p = await repo.upsertPlan(userId, day(date), picks);
    return { date, picks: p.picks, updatedAt: p.updatedAt.toISOString() };
  },
};
