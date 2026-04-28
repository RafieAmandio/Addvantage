import { prisma } from "@/config/database.js";
import type { Prisma } from "@tradevantage/db";

export const subscriptionRepository = {
  updateTier: (profileId: string, tier: string) =>
    prisma.profile.update({
      where: { id: profileId },
      data: { tier },
    }),

  findProfile: (profileId: string) =>
    prisma.profile.findUnique({
      where: { id: profileId },
      select: { email: true, handle: true, tier: true },
    }),

  getSubscriptionStatus: (profileId: string) =>
    prisma.profile.findUnique({
      where: { id: profileId },
      select: {
        tier: true,
        renewsAt: true,
        signedLiability: true,
        joinedAt: true,
      },
    }),

  getPaymentHistory: (profileId: string, limit: number) =>
    prisma.emailLog.findMany({
      where: { profileId, kind: { in: ["dunning", "renewal_reminder", "checkout"] } },
      select: {
        id: true,
        kind: true,
        provider: true,
        sentAt: true,
        templateId: true,
      },
      orderBy: { sentAt: "desc" },
      take: limit,
    }),

  insertEmailLog: (data: {
    profileId: string;
    kind: string;
    provider: string;
    externalMessageId: string;
    templateId: string;
    payload: Prisma.InputJsonValue;
  }) =>
    prisma.emailLog.create({
      data: {
        profileId: data.profileId,
        kind: data.kind,
        provider: data.provider,
        externalMessageId: data.externalMessageId,
        templateId: data.templateId,
        payload: data.payload,
      },
    }),
};
