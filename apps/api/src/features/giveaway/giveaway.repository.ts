import { prisma } from "@/config/database.js";

export interface EntryData {
  bingxUid: string;
  email: string;
  telegram: string;
  name?: string;
}

export const giveawayRepository = {
  // Dedupe by UID: re-submitting the same BingX UID updates the contact details
  // rather than creating a duplicate entry.
  upsert: (d: EntryData) =>
    prisma.giveawayEntry.upsert({
      where: { bingxUid: d.bingxUid },
      update: { email: d.email, telegram: d.telegram, name: d.name ?? null },
      create: {
        bingxUid: d.bingxUid,
        email: d.email,
        telegram: d.telegram,
        name: d.name ?? null,
      },
    }),

  list: () => prisma.giveawayEntry.findMany({ orderBy: { createdAt: "desc" } }),

  count: () => prisma.giveawayEntry.count(),

  // Pick a random entry that hasn't already won, and mark it as won.
  drawRandom: async () => {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM giveaway_entries WHERE won_at IS NULL ORDER BY random() LIMIT 1
    `;
    const row = rows[0];
    if (!row) return null;
    return prisma.giveawayEntry.update({
      where: { id: row.id },
      data: { wonAt: new Date() },
    });
  },
};
