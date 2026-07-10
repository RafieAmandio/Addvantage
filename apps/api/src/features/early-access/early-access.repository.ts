import { prisma } from "@/config/database.js";

export interface CreateApplicationData {
  email: string;
  telegramHandle: string;
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
  create: (data: CreateApplicationData) =>
    prisma.earlyAccessApplication.create({ data }),

  markConfirmationSent: (id: string) =>
    prisma.earlyAccessApplication.update({
      where: { id },
      data: { confirmationEmailSentAt: new Date() },
    }),
};
