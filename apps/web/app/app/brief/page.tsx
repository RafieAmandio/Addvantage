import { listApprovedNews } from "@/features/news/queries/news";
import { BriefClient } from "./BriefClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BriefPage() {
  const news = await listApprovedNews();
  return <BriefClient news={news} />;
}
