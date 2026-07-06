import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { getVideoForAdmin } from "@/features/videos/admin/queries";
import { VideoEditorForm } from "@/features/videos/components/admin/VideoEditorForm";

export const metadata: Metadata = { title: "Edit Video" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminVideoEditPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();
  const video = await getVideoForAdmin(params.id);
  if (!video) notFound();

  return (
    <div className="stagger mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="mb-6 font-display text-4xl text-white">
        Edit <span className="italic text-brand">video</span>
      </h1>
      <VideoEditorForm video={video} />
    </div>
  );
}
