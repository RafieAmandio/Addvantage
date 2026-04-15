import type { User } from "./types";

export const defaultUser: User = {
  id: "U-00417",
  handle: "operator-00417",
  email: "operator@domain.local",
  tier: "free",
  signedLiability: false,
  joinedAt: "2026-03-12T08:00:00Z",
};

export const upgradedUser: User = {
  ...defaultUser,
  tier: "vip",
  signedLiability: true,
  package: "VIP+ Trader",
  renewsAt: "2026-07-07T08:00:00Z",
};
