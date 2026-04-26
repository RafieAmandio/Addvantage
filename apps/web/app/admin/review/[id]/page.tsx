import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getNewsItemById } from "@/features/news/queries/news";
import { ReviewEditor } from "./ReviewEditor";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const item = await getNewsItemById(params.id);
  if (!item) return { title: "Not Found" };
  return { title: `Review: ${item.headline}` };
}

export default async function AdminReviewItemPage({
  params,
}: {
  params: { id: string };
}) {
  const item = await getNewsItemById(params.id);
  if (!item) return notFound();
  return <ReviewEditor item={item} />;
}
