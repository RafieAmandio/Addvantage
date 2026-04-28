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
