import { listApprovedNews } from "@/features/news/queries/news";
import { listPublishedPrimers } from "@/features/education/queries/primers";
import { DashboardClient } from "./DashboardClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const [news, primers] = await Promise.all([
    listApprovedNews(),
    listPublishedPrimers(),
  ]);
  return <DashboardClient news={news} primers={primers} />;
}
