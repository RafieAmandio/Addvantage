import { prisma } from "@/config/database.js";
import type {
  BulletinLevelInput,
  BulletinIngestInput,
} from "@tradevantage/shared/schema";

const withLevels = { levels: true } as const;

// Fields on the instrument itself (everything except symbol + levels).
interface InstrumentFields {
  status?: string;
  bias?: string;
  whatToWatch?: string;
  entry?: string;
  exit?: string;
  note?: string;
  sortOrder?: number;
}

function levelUpdateData(level: BulletinLevelInput) {
  return {
    marketStructure: level.marketStructure,
    bosLevel: level.bosLevel ?? null,
    comment: level.comment ?? null,
  };
}

export const bulletinRepository = {
  list: () =>
    prisma.bulletinInstrument.findMany({
      orderBy: { updatedAt: "desc" },
      include: withLevels,
    }),

  findById: (id: string) =>
    prisma.bulletinInstrument.findUnique({ where: { id }, include: withLevels }),

  findBySymbol: (symbol: string) =>
    prisma.bulletinInstrument.findUnique({ where: { symbol }, include: withLevels }),

  create: (data: InstrumentFields & { symbol: string }, levels?: BulletinLevelInput[]) =>
    prisma.bulletinInstrument.create({
      data: {
        ...data,
        ...(levels?.length ? { levels: { create: levels.map((l) => ({ ...l })) } } : {}),
      },
      include: withLevels,
    }),

  update: (id: string, data: InstrumentFields & { symbol?: string }) =>
    prisma.bulletinInstrument.update({ where: { id }, data, include: withLevels }),

  delete: (id: string) => prisma.bulletinInstrument.delete({ where: { id } }),

  // Upsert one timeframe row and bump the parent's updatedAt so the home board
  // re-sorts by most-recent activity.
  upsertLevel: async (bulletinId: string, level: BulletinLevelInput) => {
    await prisma.bulletinLevel.upsert({
      where: { bulletinId_timeframe: { bulletinId, timeframe: level.timeframe } },
      create: { bulletinId, timeframe: level.timeframe, ...levelUpdateData(level) },
      update: levelUpdateData(level),
    });
    return prisma.bulletinInstrument.update({
      where: { id: bulletinId },
      data: { updatedAt: new Date() },
      include: withLevels,
    });
  },

  // Admin form save: the submitted rows are the full picture — upsert each and
  // delete any timeframe the admin cleared. (Jeff's ingest stays additive.)
  setLevels: async (bulletinId: string, levels: BulletinLevelInput[]) => {
    const keep = levels.map((l) => l.timeframe);
    if (keep.length === 0) {
      await prisma.bulletinLevel.deleteMany({ where: { bulletinId } });
    } else {
      await prisma.bulletinLevel.deleteMany({
        where: { bulletinId, timeframe: { notIn: keep } },
      });
      for (const level of levels) {
        await prisma.bulletinLevel.upsert({
          where: { bulletinId_timeframe: { bulletinId, timeframe: level.timeframe } },
          create: { bulletinId, timeframe: level.timeframe, ...levelUpdateData(level) },
          update: levelUpdateData(level),
        });
      }
    }
  },

  // Jeff ingest: upsert the instrument by symbol, then upsert any provided
  // levels. Undefined fields are ignored by Prisma (no clobber).
  upsertBySymbol: async (input: BulletinIngestInput) => {
    const { symbol, levels, ...fields } = input;
    const instrument = await prisma.bulletinInstrument.upsert({
      where: { symbol },
      create: { symbol, ...fields },
      update: { ...fields, updatedAt: new Date() },
    });
    if (levels?.length) {
      for (const level of levels) {
        await prisma.bulletinLevel.upsert({
          where: { bulletinId_timeframe: { bulletinId: instrument.id, timeframe: level.timeframe } },
          create: { bulletinId: instrument.id, timeframe: level.timeframe, ...levelUpdateData(level) },
          update: levelUpdateData(level),
        });
      }
    }
    return prisma.bulletinInstrument.findUnique({ where: { id: instrument.id }, include: withLevels });
  },
};
