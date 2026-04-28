import { NotFoundError } from "@/core/errors/index.js";
import { timelineRepository } from "./timeline.repository.js";

interface ListOpts {
  symbols?: string[];
  kinds?: string[];
  from?: string;
  to?: string;
  limit?: number;
}

export const timelineService = {
  async list(opts: ListOpts) {
    if (opts.symbols && opts.symbols.length === 0) return [];
    if (opts.kinds && opts.kinds.length === 0) return [];
    return timelineRepository.list({
      symbols: opts.symbols,
      kinds: opts.kinds,
      from: opts.from,
      to: opts.to,
      limit: opts.limit ?? 200,
    });
  },

  async getById(id: string) {
    const event = await timelineRepository.findById(id);
    if (!event) throw new NotFoundError("Timeline event not found");
    return event;
  },

  async createPin(userId: string, data: {
    title: string;
    body?: string;
    symbol: string;
    occurredAt: string;
  }) {
    return timelineRepository.createPin({
      title: data.title,
      body: data.body ?? null,
      symbols: [data.symbol.toUpperCase()],
      occurredAt: new Date(data.occurredAt),
      createdBy: userId,
    });
  },
};
