import { NotFoundError } from "@/core/errors/index.js";
import {
  BULLETIN_TIMEFRAMES,
  type BulletinCreateInput,
  type BulletinUpdateInput,
  type BulletinLevelInput,
  type BulletinIngestInput,
} from "@tradevantage/shared/schema";
import { bulletinRepository } from "./bulletin.repository.js";

const TF_ORDER = new Map<string, number>(BULLETIN_TIMEFRAMES.map((t, i) => [t, i]));

// Return levels in canonical timeframe order (1H → 1W) regardless of insert order.
function ordered<T extends { levels: { timeframe: string }[] }>(b: T): T {
  b.levels.sort(
    (a, z) => (TF_ORDER.get(a.timeframe) ?? 99) - (TF_ORDER.get(z.timeframe) ?? 99),
  );
  return b;
}

export const bulletinService = {
  async list() {
    const rows = await bulletinRepository.list();
    return rows.map(ordered);
  },

  async getById(id: string) {
    const b = await bulletinRepository.findById(id);
    if (!b) throw new NotFoundError("Bulletin not found");
    return ordered(b);
  },

  async create(input: BulletinCreateInput) {
    const { symbol, levels, ...fields } = input;
    const b = await bulletinRepository.create({ symbol, ...fields }, levels);
    return ordered(b);
  },

  async update(id: string, input: BulletinUpdateInput) {
    await this.getById(id);
    const { levels, ...fields } = input;
    await bulletinRepository.update(id, fields);
    // When the admin form submits levels, they are the authoritative full set.
    if (levels !== undefined) await bulletinRepository.setLevels(id, levels);
    return this.getById(id);
  },

  async upsertLevel(id: string, level: BulletinLevelInput) {
    await this.getById(id);
    return ordered(await bulletinRepository.upsertLevel(id, level));
  },

  async delete(id: string) {
    await this.getById(id);
    return bulletinRepository.delete(id);
  },

  async ingest(input: BulletinIngestInput) {
    const b = await bulletinRepository.upsertBySymbol(input);
    return b ? ordered(b) : b;
  },
};
