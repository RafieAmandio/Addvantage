import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { BulletinEditorForm } from "@/features/bulletin/components/admin/BulletinEditorForm";

export const metadata: Metadata = { title: "New instrument" };
export const dynamic = "force-dynamic";

export default async function NewBulletinPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/admin/bulletin"
        className="font-mono text-[10px] uppercase tracking-widest2 text-white/40 transition-colors hover:text-brand"
      >
        ← Bulletin
      </Link>
      <h1 className="mt-3 mb-8 font-display text-4xl text-white">
        New <span className="italic text-brand">instrument</span>
      </h1>
      <BulletinEditorForm bulletin={null} />
    </div>
  );
}
