import { apiGet } from "@/lib/api/client-server";

export interface PaymentRecord {
  id: string;
  externalRef: string;
  provider: string;
  amount: number;
  currency: string;
  status: string;
  tier: string;
  invoiceUrl: string;
  paidAt: string | null;
  createdAt: string;
}

export async function getPaymentHistory(limit = 50): Promise<PaymentRecord[]> {
  try {
    return await apiGet<PaymentRecord[]>(`/subscription/history?limit=${limit}`);
  } catch {
    return [];
  }
}
