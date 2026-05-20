import { createHash } from "crypto";
import { NotFoundError, ForbiddenError } from "@/core/errors/index.js";
import type { PaginationOpts } from "@/core/utils/pagination.js";
import { newsRepository, type AdminFilterOpts } from "./news.repository.js";

function contentHash(parts: (string | null | undefined)[]): string {
  const joined = parts
    .filter(Boolean)
    .map((s) => String(s).replace(/\s+/g, " ").trim())
    .join("␞");
  return createHash("sha256").update(joined).digest("hex");
}

export const newsService = {
  async listApproved(opts: PaginationOpts) {
    const [content, total] = await Promise.all([
      newsRepository.findApproved(opts),
      newsRepository.countApproved(),
    ]);
    return { content, total, page: opts.page, limit: opts.limit };
  },

  async getApproved(id: string) {
    const item = await newsRepository.findApprovedById(id);
    if (!item) throw new NotFoundError("News item not found");
    return item;
  },

  async listFiltered(opts: PaginationOpts & AdminFilterOpts) {
    const [content, total] = await Promise.all([
      newsRepository.findFiltered(opts),
      newsRepository.countFiltered(opts),
    ]);
    return { content, total, page: opts.page, limit: opts.limit };
  },

  async listRejected(opts: PaginationOpts) {
    const [content, total] = await Promise.all([
      newsRepository.findRejected(opts),
      newsRepository.countRejected(),
    ]);
    return { content, total, page: opts.page, limit: opts.limit };
  },

  async getForAdmin(id: string) {
    const item = await newsRepository.findById(id);
    if (!item) throw new NotFoundError("News item not found");
    return item;
  },

  async create(data: {
    headline: string;
    rephrased: string;
    analysis: string;
    impact: string;
    bias: string;
    affects: string[];
    tags: string[];
    author: string;
    sourceCode: string;
    sourceUrl: string | null;
    rawText: string | null;
  }) {
    const hash = contentHash([data.sourceCode, "manual", data.headline]);
    return newsRepository.create({
      ...data,
      contentHash: hash,
    });
  },

  async updateDraft(
    id: string,
    data: {
      headline: string;
      rephrased: string;
      analysis: string;
      impact: string;
      bias: string;
      affects: string[];
      tags: string[];
      author: string;
    },
  ) {
    const item = await newsRepository.findById(id);
    if (!item) throw new NotFoundError("News item not found");
    return newsRepository.updateDraft(id, data);
  },

  async approve(id: string, reviewerId: string) {
    const item = await newsRepository.findById(id);
    if (!item) throw new NotFoundError("News item not found");
    if (item.status !== "pending") {
      throw new ForbiddenError("Only pending items can be approved");
    }
    return newsRepository.approve(id, reviewerId);
  },

  async reject(id: string, reviewerId: string) {
    const item = await newsRepository.findById(id);
    if (!item) throw new NotFoundError("News item not found");
    if (item.status !== "pending") {
      throw new ForbiddenError("Only pending items can be rejected");
    }
    return newsRepository.reject(id, reviewerId);
  },
};
