import { listApprovedNews } from "@/features/news/queries/news";
import { NewsListClient } from "./NewsListClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewsPage() {
  const items = await listApprovedNews();
  return <NewsListClient items={items} />;
}
