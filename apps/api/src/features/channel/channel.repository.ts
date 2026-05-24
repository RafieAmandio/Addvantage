import { prisma } from "@/config/database.js";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const channelRepository = {
  // ─── threads ─────────────────────────────────────────────────────────

  listThreads: () =>
    prisma.channelThread.findMany({ orderBy: { sortOrder: "asc" } }),

  findThreadById: (id: string) =>
    prisma.channelThread.findUnique({ where: { id } }),

  findThreadBySlug: (slug: string) =>
    prisma.channelThread.findUnique({ where: { slug } }),

  createThread: async (data: { title: string; description?: string }) => {
    const base = slugify(data.title);
    let slug = base;
    let i = 1;
    while (await prisma.channelThread.findUnique({ where: { slug } })) {
      slug = `${base}-${i++}`;
    }
    const maxOrder = await prisma.channelThread.aggregate({ _max: { sortOrder: true } });
    return prisma.channelThread.create({
      data: { ...data, slug, sortOrder: (maxOrder._max.sortOrder ?? -1) + 1 },
    });
  },

  updateThread: (id: string, data: { title?: string; description?: string | null; sortOrder?: number }) =>
    prisma.channelThread.update({ where: { id }, data }),

  deleteThread: (id: string) =>
    prisma.channelThread.delete({ where: { id } }),

  // ─── posts ───────────────────────────────────────────────────────────

  list: (opts: { limit: number; offset: number; includeUnpublished?: boolean; threadId?: string }) => {
    const where: Record<string, unknown> = {};
    if (!opts.includeUnpublished) where.published = true;
    if (opts.threadId) where.threadId = opts.threadId;
    return prisma.channelPost.findMany({
      where,
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: opts.limit,
      skip: opts.offset,
      include: { thread: { select: { id: true, title: true, slug: true } } },
    });
  },

  count: (includeUnpublished = false, threadId?: string) => {
    const where: Record<string, unknown> = {};
    if (!includeUnpublished) where.published = true;
    if (threadId) where.threadId = threadId;
    return prisma.channelPost.count({ where });
  },

  findById: (id: string) =>
    prisma.channelPost.findUnique({
      where: { id },
      include: { thread: { select: { id: true, title: true, slug: true } } },
    }),

  create: (data: {
    body: string;
    author?: string;
    imageUrl?: string;
    tags?: string[];
    pinned?: boolean;
    published?: boolean;
    threadId?: string | null;
  }) =>
    prisma.channelPost.create({
      data,
      include: { thread: { select: { id: true, title: true, slug: true } } },
    }),

  update: (
    id: string,
    data: {
      body?: string;
      author?: string;
      imageUrl?: string | null;
      tags?: string[];
      pinned?: boolean;
      published?: boolean;
      threadId?: string | null;
    },
  ) =>
    prisma.channelPost.update({
      where: { id },
      data,
      include: { thread: { select: { id: true, title: true, slug: true } } },
    }),

  delete: (id: string) =>
    prisma.channelPost.delete({ where: { id } }),
};
