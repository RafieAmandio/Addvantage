import { prisma } from "@/config/database.js";

const PROFILE_SELECT = {
  id: true,
  email: true,
  handle: true,
  tier: true,
  isAdmin: true,
  signedLiability: true,
  joinedAt: true,
  renewsAt: true,
  package: true,
  tradingLength: true,
  longestProfitable: true,
  markets: true,
  yearlyGoal: true,
  faultAttribution: true,
} as const;

const ME_SELECT = {
  id: true,
  email: true,
  handle: true,
  tier: true,
  isAdmin: true,
  signedLiability: true,
} as const;

export const userRepository = {
  findById: (id: string) =>
    prisma.profile.findUnique({
      where: { id },
      select: PROFILE_SELECT,
    }),

  findMe: (id: string) =>
    prisma.profile.findUnique({
      where: { id },
      select: ME_SELECT,
    }),

  findAll: () =>
    prisma.profile.findMany({
      select: {
        id: true,
        email: true,
        handle: true,
        tier: true,
        isAdmin: true,
        signedLiability: true,
        joinedAt: true,
        tradingLength: true,
        longestProfitable: true,
        markets: true,
      },
      orderBy: { joinedAt: "desc" },
    }),

  updateProfile: (
    id: string,
    data: {
      handle?: string;
      tradingLength?: string;
      longestProfitable?: string;
      markets?: string[];
      yearlyGoal?: string;
      faultAttribution?: string;
    },
  ) =>
    prisma.profile.update({
      where: { id },
      data,
    }),
};
