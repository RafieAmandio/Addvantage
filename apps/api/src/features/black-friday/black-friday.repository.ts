import type { Prisma } from "@tradevantage/db";
import { prisma } from "@/config/database.js";

export interface DraftData {
  email: string;
  name: string;
  contact: string;
  bingxUid?: string;
}

export type FinalData = Omit<
  Prisma.BlackFridayApplicationUncheckedCreateInput,
  "id" | "status" | "createdAt" | "updatedAt"
> & { email: string; name: string; contact: string };

export const blackFridayRepository = {
  findByEmail: (email: string) => prisma.blackFridayApplication.findUnique({ where: { email } }),

  findByUid: (bingxUid: string) =>
    prisma.blackFridayApplication.findUnique({ where: { bingxUid }, select: { id: true, email: true } }),

  findById: (id: string) => prisma.blackFridayApplication.findUnique({ where: { id } }),

  // Identity (and BingX) step: create the draft or refresh it. Keyed by email so a
  // returning visitor resumes their row.
  upsertDraft: (data: DraftData) => {
    const fields = { name: data.name, contact: data.contact, ...(data.bingxUid ? { bingxUid: data.bingxUid } : {}) };
    return prisma.blackFridayApplication.upsert({
      where: { email: data.email },
      update: fields,
      create: { email: data.email, ...fields },
    });
  },

  // Final submit: fill every field and flip to 'submitted'. Upsert so a skipped draft still works.
  finalize: (data: FinalData) => {
    const { email, ...fields } = data;
    return prisma.blackFridayApplication.upsert({
      where: { email },
      update: { ...fields, status: "submitted" },
      create: { email, ...fields, status: "submitted" },
    });
  },

  // Admin: everything past draft, newest first. Grouping happens in the service.
  listSubmitted: () =>
    prisma.blackFridayApplication.findMany({
      where: { status: { not: "draft" } },
      orderBy: { createdAt: "desc" },
    }),

  countDrafts: () => prisma.blackFridayApplication.count({ where: { status: "draft" } }),

  countDinnerInvites: () =>
    prisma.blackFridayApplication.count({ where: { dinnerInvitedAt: { not: null } } }),

  update: (id: string, data: Prisma.BlackFridayApplicationUncheckedUpdateInput) =>
    prisma.blackFridayApplication.update({ where: { id }, data }),

  findProfileByEmail: (email: string) =>
    prisma.profile.findUnique({ where: { email }, select: { id: true, tier: true, renewsAt: true } }),

  setProfileAccess: (id: string, data: { tier: string; renewsAt?: Date | null }) =>
    prisma.profile.update({ where: { id }, data, select: { id: true, tier: true, renewsAt: true } }),
};
