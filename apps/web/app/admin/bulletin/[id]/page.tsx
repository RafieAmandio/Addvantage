import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { getBulletinForAdmin } from "@/features/bulletin/admin/queries";
import { BulletinEditorForm } from "@/features/bulletin/components/admin/BulletinEditorForm";

export const metadata: Metadata = { title: "Edit instrument" };
export const dynamic = "force-dynamic";

export default async function EditBulletinPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const bulletin = await getBulletinForAdmin(params.id);
  if (!bulletin) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-[13px]">
        <Link href="/admin/bulletin" className="font-medium text-white/55 transition-colors hover:text-white">
          Bulletin
        </Link>
        <span className="text-white/25">/</span>
        <span className="font-medium text-white">{bulletin.symbol}</span>
      </div>
      <BulletinEditorForm bulletin={bulletin} />
    </div>
  );
}
