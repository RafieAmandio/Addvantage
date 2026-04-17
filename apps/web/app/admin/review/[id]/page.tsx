import { notFound } from "next/navigation";
import { getNewsItemById } from "@/features/news/queries/news";
import { ReviewEditor } from "./ReviewEditor";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminReviewItemPage({
  params,
}: {
  params: { id: string };
}) {
  const item = await getNewsItemById(params.id);
  if (!item) return notFound();
  return <ReviewEditor item={item} />;
}
