import type { Metadata } from "next";
import { listApprovedNews } from "@/features/news/queries/news";
import { listPublishedPlans } from "@/features/plan/queries/plans";
import { listPredictions } from "@/features/predictions/queries/predictions";
import { DashboardClient } from "./DashboardClient";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const [news, plans, predictions] = await Promise.all([
    listApprovedNews(),
    listPublishedPlans({ limit: 20 }),
    listPredictions().catch(() => []),
  ]);
  return <DashboardClient news={news} plans={plans} predictions={predictions} />;
}
