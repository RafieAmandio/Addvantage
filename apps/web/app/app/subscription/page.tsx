import { getSubscriptionStatus } from "@/features/subscription/queries/status";
import { getPaymentHistory } from "@/features/subscription/queries/history";
import { SubscriptionPageClient } from "@/features/subscription/components/SubscriptionPageClient";

export default async function SubscriptionPage() {
  const [status, history] = await Promise.all([
    getSubscriptionStatus(),
    getPaymentHistory(),
  ]);

  return <SubscriptionPageClient status={status} history={history} />;
}
