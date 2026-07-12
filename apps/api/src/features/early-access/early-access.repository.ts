import { prisma } from "@/config/database.js";

export interface LeadData {
  email: string;
  telegramHandle: string;
}

export interface ApplicationData extends LeadData {
  wantsCashback: boolean;
  broker: string | null;
  brokerAccountRef: string | null;
  signedName: string;
  signedAt: Date;
  acknowledgements: Record<string, boolean>;
  paymentMethod: string;
  paymentAmount: number;
  paymentCurrency: string;
  proofImageUrl: string;
}

export const earlyAccessRepository = {
  // Identity step: create the draft or update the handle. Keyed by email so a
  // returning visitor resumes their row instead of duplicating it.
  upsertLead: (data: LeadData) =>
    prisma.earlyAccessApplication.upsert({
      where: { email: data.email },
      update: { telegramHandle: data.telegramHandle },
      create: { email: data.email, telegramHandle: data.telegramHandle },
    }),

  // Final submit: fill the remaining fields and flip the draft to 'pending'.
  // Upsert so it also works if the lead step was skipped.
  finalize: (data: ApplicationData) => {
    const fields = {
      telegramHandle: data.telegramHandle,
      wantsCashback: data.wantsCashback,
      broker: data.broker,
      brokerAccountRef: data.brokerAccountRef,
      signedName: data.signedName,
      signedAt: data.signedAt,
      acknowledgements: data.acknowledgements,
      paymentMethod: data.paymentMethod,
      paymentAmount: data.paymentAmount,
      paymentCurrency: data.paymentCurrency,
      proofImageUrl: data.proofImageUrl,
      status: "pending",
    };
    return prisma.earlyAccessApplication.upsert({
      where: { email: data.email },
      update: fields,
      create: { email: data.email, ...fields },
    });
  },

  markConfirmationSent: (id: string) =>
    prisma.earlyAccessApplication.update({
      where: { id },
      data: { confirmationEmailSentAt: new Date() },
    }),

  // Admin: list every application, newest first. Proof key is returned so the
  // admin UI can request a signed URL for it.
  listAll: () =>
    prisma.earlyAccessApplication.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        telegramHandle: true,
        wantsCashback: true,
        broker: true,
        brokerAccountRef: true,
        paymentMethod: true,
        paymentAmount: true,
        paymentCurrency: true,
        proofImageUrl: true,
        status: true,
        createdAt: true,
        provisionedAt: true,
        accountId: true,
      },
    }),

  findById: (id: string) =>
    prisma.earlyAccessApplication.findUnique({ where: { id } }),

  markProvisioned: (id: string, accountId: string) =>
    prisma.earlyAccessApplication.update({
      where: { id },
      data: { status: "provisioned", provisionedAt: new Date(), accountId },
    }),
};
