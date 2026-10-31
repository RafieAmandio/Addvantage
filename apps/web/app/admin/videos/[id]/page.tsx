import type { Metadata } from "next";
import Link from "next/link";
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
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-[13px]">
        <Link href="/admin/videos" className="font-medium text-white/55 transition-colors hover:text-white">
          Videos
        </Link>
        <span className="text-white/25">/</span>
        <span className="font-medium text-white">Edit video</span>
      </div>
      <VideoEditorForm video={video} />
    </div>
  );
}
