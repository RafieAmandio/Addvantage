import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { VideoEditorForm } from "@/features/videos/components/admin/VideoEditorForm";

export const metadata: Metadata = { title: "New Video" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminVideoNewPage() {
  await requireAdmin();
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-[13px]">
        <Link href="/admin/videos" className="font-medium text-white/55 transition-colors hover:text-white">
          Videos
        </Link>
        <span className="text-white/25">/</span>
        <span className="font-medium text-white">New video</span>
      </div>
      <VideoEditorForm video={null} />
    </div>
  );
}
