import { apiGet } from "@/lib/api/client-server";

export interface SubscriptionStatus {
  tier: string;
  renewsAt: string | null;
  signedLiability: boolean;
  joinedAt: string | null;
}

export async function getSubscriptionStatus(): Promise<SubscriptionStatus | null> {
  try {
    return await apiGet<SubscriptionStatus>("/subscription/status");
  } catch {
    return null;
  }
}
