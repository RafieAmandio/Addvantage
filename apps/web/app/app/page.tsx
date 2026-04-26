import { listApprovedNews } from "@/features/news/queries/news";
import { listPublishedPrimers } from "@/features/education/queries/primers";
import { listPublishedPlans } from "@/features/plan/queries/plans";
import { DashboardClient } from "./DashboardClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const [news, primers, plans] = await Promise.all([
    listApprovedNews(),
    listPublishedPrimers(),
    listPublishedPlans({ limit: 20 }),
  ]);
  return <DashboardClient news={news} primers={primers} plans={plans} />;
}
