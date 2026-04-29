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
    prisma.payment.findMany({
      where: { profileId },
      select: {
        id: true,
        externalRef: true,
        provider: true,
        amount: true,
        currency: true,
        status: true,
        tier: true,
        invoiceUrl: true,
        paidAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),

  createPayment: (data: {
    profileId: string;
    externalId: string;
    externalRef: string;
    provider: string;
    amount: number;
    currency: string;
    tier: string;
    invoiceUrl: string;
    description: string;
    expiredAt?: Date;
    metadata?: Prisma.InputJsonValue;
  }) =>
    prisma.payment.create({ data }),

  findPaymentByExternalRef: (externalRef: string) =>
    prisma.payment.findUnique({ where: { externalRef } }),

  updatePaymentStatus: (externalRef: string, status: string, paidAt?: Date) =>
    prisma.payment.update({
      where: { externalRef },
      data: { status, ...(paidAt ? { paidAt } : {}) },
    }),

  insertEmailLog: (data: {
    profileId: string;
    kind: string;
    provider: string;
    externalMessageId: string;
    templateId: string | null;
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
