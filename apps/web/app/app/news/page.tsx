import type { Metadata } from "next";
import { listApprovedNews } from "@/features/news/queries/news";

export const metadata: Metadata = { title: "News" };
import { NewsListClient } from "./NewsListClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewsPage() {
  const items = await listApprovedNews();
  return <NewsListClient items={items} />;
}
