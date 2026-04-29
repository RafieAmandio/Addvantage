import { prisma } from "@/config/database.js";
import type { PaginationOpts } from "@/core/utils/pagination.js";

const LIST_SELECT = {
  id: true,
  sourceCode: true,
  headline: true,
  analysis: true,
  impact: true,
  bias: true,
  affects: true,
  tags: true,
  author: true,
  publishedAt: true,
  fetchedAt: true,
  relatedPlanIds: true,
} as const;

const ADMIN_LIST_SELECT = {
  id: true,
  sourceCode: true,
  headline: true,
  analysis: true,
  impact: true,
  bias: true,
  affects: true,
  tags: true,
  fetchedAt: true,
  reviewedAt: true,
} as const;

const DETAIL_SELECT = {
  id: true,
  sourceCode: true,
  sourceUrl: true,
  rawText: true,
  contentHash: true,
  fetchedAt: true,
  publishedAt: true,
  status: true,
  headline: true,
  rephrased: true,
  analysis: true,
  impact: true,
  bias: true,
  affects: true,
  tags: true,
  author: true,
  reviewedAt: true,
  reviewedBy: true,
  relatedPlanIds: true,
  aiSystemPrompt: true,
  aiUserMessage: true,
  aiRawResponse: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const newsRepository = {
  findApproved: (opts: PaginationOpts) =>
    prisma.newsItem.findMany({
      where: { status: "approved" },
      select: LIST_SELECT,
      orderBy: [{ publishedAt: "desc" }, { fetchedAt: "desc" }],
      skip: opts.skip,
      take: opts.limit,
    }),

  countApproved: () =>
    prisma.newsItem.count({ where: { status: "approved" } }),

  findApprovedById: (id: string) =>
    prisma.newsItem.findFirst({
      where: { id, status: "approved" },
      select: LIST_SELECT,
    }),

  findPending: (opts: PaginationOpts) =>
    prisma.newsItem.findMany({
      where: { status: "pending" },
      select: ADMIN_LIST_SELECT,
      orderBy: { fetchedAt: "asc" },
      skip: opts.skip,
      take: opts.limit,
    }),

  countPending: () =>
    prisma.newsItem.count({ where: { status: "pending" } }),

  findRejected: (opts: PaginationOpts) =>
    prisma.newsItem.findMany({
      where: { status: "rejected" },
      select: ADMIN_LIST_SELECT,
      orderBy: { reviewedAt: "desc" },
      skip: opts.skip,
      take: opts.limit,
    }),

  countRejected: () =>
    prisma.newsItem.count({ where: { status: "rejected" } }),

  findById: (id: string) =>
    prisma.newsItem.findUnique({
      where: { id },
      select: DETAIL_SELECT,
    }),

  create: (data: {
    sourceCode: string;
    sourceUrl: string | null;
    rawText: string | null;
    contentHash: string;
    headline: string;
    rephrased: string;
    analysis: string;
    impact: string;
    bias: string;
    affects: string[];
    tags: string[];
    author: string;
  }) =>
    prisma.newsItem.create({
      data: {
        ...data,
        status: "pending",
      },
      select: { id: true },
    }),

  updateDraft: (
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
  ) =>
    prisma.newsItem.update({
      where: { id },
      data,
    }),

  approve: (id: string, reviewerId: string) =>
    prisma.newsItem.update({
      where: { id },
      data: {
        status: "approved",
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        publishedAt: new Date(),
      },
    }),

  reject: (id: string, reviewerId: string) =>
    prisma.newsItem.update({
      where: { id },
      data: {
        status: "rejected",
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        publishedAt: null,
      },
    }),
};
