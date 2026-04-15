import { notFound } from "next/navigation";
import { getApprovedNewsById, listApprovedNews } from "@/lib/queries/news";
import { NewsDetailClient } from "./NewsDetailClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewsDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [item, feed] = await Promise.all([
    getApprovedNewsById(params.id),
    listApprovedNews(),
  ]);
  if (!item) return notFound();
  return <NewsDetailClient item={item} relatedFeed={feed} />;
}
