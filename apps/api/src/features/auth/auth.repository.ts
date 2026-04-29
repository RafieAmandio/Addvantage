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
};
