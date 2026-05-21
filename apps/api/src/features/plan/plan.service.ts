import type { Prisma } from "@tradevantage/db";
import { NotFoundError, ForbiddenError, AppError } from "@/core/errors/index.js";
import type { PaginationOpts } from "@/core/utils/pagination.js";
import { getStorageProvider } from "@/integrations/storage/index.js";
import { planRepository } from "./plan.repository.js";

function computeRealizedR(input: {
  direction: string;
  entry: number | null;
  stop: number | null;
  closePrice: number | null;
}): number | null {
  const { direction, entry, stop, closePrice } = input;
  if (entry === null || stop === null || closePrice === null) return null;
  if (entry === stop) return null;
  const raw =
    direction === "long"
      ? (closePrice - entry) / (entry - stop)
      : (entry - closePrice) / (stop - entry);
  if (!Number.isFinite(raw)) return null;
  return Math.round(raw * 100) / 100;
}

export const planService = {
  async listPublished(opts: PaginationOpts & { symbol?: string }) {
    const [content, total] = await Promise.all([
      planRepository.findPublished(opts),
      planRepository.countPublished(opts.symbol),
    ]);
    return { content, total, page: opts.page, limit: opts.limit };
  },

  async getPublished(id: string) {
    const plan = await planRepository.findById(id);
    if (!plan) throw new NotFoundError("Plan not found");
    if (plan.status !== "published") throw new NotFoundError("Plan not found");
    return plan;
  },

  async getNewsForPlan(planId: string) {
    const plan = await planRepository.findById(planId);
    if (!plan) throw new NotFoundError("Plan not found");
    return planRepository.getNewsForPlan(planId);
  },

  async getStats() {
    const rows = await planRepository.findClosedWithR(500);
    const n = rows.length;
    if (n === 0) {
      const empty = { n: 0, winRate: null, avgR: null };
      return { ...empty, byDirection: { long: { ...empty }, short: { ...empty } } };
    }

    const wins = rows.filter((r) => r.outcome === "win").length;
    const sumR = rows.reduce((acc, r) => acc + Number(r.realizedR), 0);

    const bucket = (dir: string) => {
      const sub = rows.filter((r) => r.direction === dir);
      const sn = sub.length;
      if (sn === 0) return { n: 0, winRate: null, avgR: null };
      const w = sub.filter((r) => r.outcome === "win").length;
      const s = sub.reduce((acc, r) => acc + Number(r.realizedR), 0);
      return { n: sn, winRate: w / sn, avgR: s / sn };
    };

    return {
      n,
      winRate: wins / n,
      avgR: sumR / n,
      byDirection: { long: bucket("long"), short: bucket("short") },
    };
  },

  async listAllForAdmin(opts: PaginationOpts) {
    const [content, total] = await Promise.all([
      planRepository.findAllForAdmin(opts),
      planRepository.countAll(),
    ]);
    return { content, total, page: opts.page, limit: opts.limit };
  },

  async listMyDrafts(authorId: string, opts: PaginationOpts) {
    const [content, total] = await Promise.all([
      planRepository.findMyDrafts(authorId, opts),
      planRepository.countMyDrafts(authorId),
    ]);
    return { content, total, page: opts.page, limit: opts.limit };
  },

  async getForAdmin(id: string) {
    const plan = await planRepository.findById(id);
    if (!plan) throw new NotFoundError("Plan not found");
    return plan;
  },

  async create(data: {
    symbol: string;
    thesis: string;
    direction: string;
    bias: string;
    entry: number | null;
    stop: number | null;
    target: number | null;
    rMultiple: number | null;
    setups: Prisma.InputJsonValue;
    tags: string[];
    risks: string[];
    tier: string;
    authorId: string;
  }) {
    return planRepository.create(data);
  },

  async update(
    id: string,
    data: {
      symbol?: string;
      thesis?: string;
      direction?: string;
      bias?: string;
      entry?: number | null;
      stop?: number | null;
      target?: number | null;
      rMultiple?: number | null;
      setups?: Prisma.InputJsonValue;
      tags?: string[];
      risks?: string[];
      tier?: string;
    },
  ) {
    const plan = await planRepository.findById(id);
    if (!plan) throw new NotFoundError("Plan not found");
    return planRepository.update(id, data);
  },

  async publish(id: string) {
    const plan = await planRepository.findById(id);
    if (!plan) throw new NotFoundError("Plan not found");
    if (plan.status !== "draft") {
      throw new ForbiddenError("Only draft plans can be published");
    }
    return planRepository.update(id, {
      status: "published",
      publishedAt: new Date(),
    });
  },

  async close(
    id: string,
    data: { outcome: string; closePrice: number | null },
  ) {
    const plan = await planRepository.findById(id);
    if (!plan) throw new NotFoundError("Plan not found");
    if (plan.status !== "published") {
      throw new ForbiddenError("Only published plans can be closed");
    }

    const realizedR = computeRealizedR({
      direction: plan.direction,
      entry: plan.entry ? Number(plan.entry) : null,
      stop: plan.stop ? Number(plan.stop) : null,
      closePrice: data.closePrice,
    });

    return planRepository.update(id, {
      status: "closed",
      outcome: data.outcome,
      closePrice: data.closePrice,
      realizedR,
      closedAt: new Date(),
    });
  },

  async remove(id: string) {
    const plan = await planRepository.findById(id);
    if (!plan) throw new NotFoundError("Plan not found");
    return planRepository.remove(id);
  },

  async uploadImage(id: string, file: { buffer: Buffer; originalname: string; mimetype: string }) {
    const storage = getStorageProvider();
    if (!storage) throw new AppError("File uploads not configured", 503);

    const plan = await planRepository.findById(id);
    if (!plan) throw new NotFoundError("Plan not found");

    const uploadPromise = storage.upload({
      buffer: file.buffer,
      originalName: file.originalname,
      contentType: file.mimetype,
      folder: "plans",
    });
    if (plan.imageKey) {
      await Promise.all([uploadPromise, storage.delete(plan.imageKey).catch(() => {})]);
    }
    const result = await uploadPromise;

    await planRepository.update(id, { imageUrl: result.url, imageKey: result.key });
    return { imageUrl: result.url };
  },

  async uploadSetupImage(file: { buffer: Buffer; originalname: string; mimetype: string }) {
    const storage = getStorageProvider();
    if (!storage) throw new AppError("File uploads not configured", 503);

    const result = await storage.upload({
      buffer: file.buffer,
      originalName: file.originalname,
      contentType: file.mimetype,
      folder: "plan-setups",
    });
    return { imageUrl: result.url, imageKey: result.key };
  },

  async removeImage(id: string) {
    const storage = getStorageProvider();
    const plan = await planRepository.findById(id);
    if (!plan) throw new NotFoundError("Plan not found");

    if (plan.imageKey && storage) {
      await storage.delete(plan.imageKey).catch(() => {});
    }

    await planRepository.update(id, { imageUrl: null, imageKey: null });
  },
};
