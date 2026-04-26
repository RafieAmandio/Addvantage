import { listApprovedNews } from "@/features/news/queries/news";
import { WatchlistClient } from "./WatchlistClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function WatchlistPage() {
  const news = await listApprovedNews();
  return <WatchlistClient news={news} />;
}
