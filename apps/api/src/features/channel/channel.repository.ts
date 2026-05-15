import { prisma } from "@/config/database.js";

export const channelRepository = {
  list: (opts: { limit: number; offset: number; includeUnpublished?: boolean }) =>
    prisma.channelPost.findMany({
      where: opts.includeUnpublished ? {} : { published: true },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: opts.limit,
      skip: opts.offset,
    }),

  count: (includeUnpublished = false) =>
    prisma.channelPost.count({
      where: includeUnpublished ? {} : { published: true },
    }),

  findById: (id: string) =>
    prisma.channelPost.findUnique({ where: { id } }),

  create: (data: {
    body: string;
    author?: string;
    imageUrl?: string;
    tags?: string[];
    pinned?: boolean;
    published?: boolean;
  }) =>
    prisma.channelPost.create({ data }),

  update: (
    id: string,
    data: {
      body?: string;
      author?: string;
      imageUrl?: string | null;
      tags?: string[];
      pinned?: boolean;
      published?: boolean;
    },
  ) =>
    prisma.channelPost.update({ where: { id }, data }),

  delete: (id: string) =>
    prisma.channelPost.delete({ where: { id } }),
};
