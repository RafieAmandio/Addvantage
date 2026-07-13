import { prisma } from "@/config/database.js";

export const authRepository = {
  findByEmail: (email: string) =>
    prisma.profile.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        handle: true,
        passwordHash: true,
        emailVerified: true,
        tier: true,
        isAdmin: true,
      },
    }),

  findById: (id: string) =>
    prisma.profile.findUnique({
      where: { id },
      select: { id: true, email: true, emailVerified: true },
    }),

  create: (data: { email: string; passwordHash: string; handle?: string }) =>
    prisma.profile.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        handle: data.handle,
      },
      select: { id: true, email: true, handle: true, tier: true, isAdmin: true },
    }),

  markEmailVerified: (id: string) =>
    prisma.profile.update({
      where: { id },
      data: { emailVerified: true },
    }),

  findPasswordHashById: (id: string) =>
    prisma.profile.findUnique({
      where: { id },
      select: { id: true, passwordHash: true },
    }),

  updatePassword: (id: string, passwordHash: string) =>
    prisma.profile.update({
      where: { id },
      data: { passwordHash },
    }),

  // Creates a fully-provisioned paid account: verified so login works, VIP
  // tier, liability already signed at early-access signup, and a renewal date.
  createProvisioned: (data: {
    email: string;
    passwordHash: string;
    handle?: string;
    renewsAt: Date;
  }) =>
    prisma.profile.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        handle: data.handle,
        emailVerified: true,
        tier: "vip",
        signedLiability: true,
        renewsAt: data.renewsAt,
      },
      select: { id: true, email: true, handle: true, tier: true },
    }),
};
