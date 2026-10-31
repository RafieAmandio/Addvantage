import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { BulletinEditorForm } from "@/features/bulletin/components/admin/BulletinEditorForm";

export const metadata: Metadata = { title: "New instrument" };
export const dynamic = "force-dynamic";

export default async function NewBulletinPage() {
  await requireAdmin();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-[13px]">
        <Link href="/admin/bulletin" className="font-medium text-white/55 transition-colors hover:text-white">
          Bulletin
        </Link>
        <span className="text-white/25">/</span>
        <span className="font-medium text-white">New instrument</span>
      </div>
      <BulletinEditorForm bulletin={null} />
    </div>
  );
}
