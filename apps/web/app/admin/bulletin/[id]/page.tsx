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
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/admin/bulletin"
        className="font-mono text-[10px] uppercase tracking-widest2 text-white/40 transition-colors hover:text-brand"
      >
        ← Bulletin
      </Link>
      <h1 className="mt-3 mb-8 font-display text-4xl text-white">
        {bulletin.symbol} <span className="italic text-brand">bulletin</span>
      </h1>
      <BulletinEditorForm bulletin={bulletin} />
    </div>
  );
}
