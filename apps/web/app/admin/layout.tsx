import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  if (!profile) {
    redirect("/login?next=/admin/review");
  }
  if (!profile.is_admin) {
    return (
      <div className="min-h-screen bg-ink p-12 font-mono text-[11px] uppercase tracking-widest2 text-blood">
        ● FORBIDDEN — ADMIN ACCESS ONLY
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-ink">
      <div className="border-b border-ink-3 bg-ink-2/40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <span className="font-mono text-[10px] uppercase tracking-widest2 text-amber">
              DESK · ADMIN
            </span>
            <nav className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest2 text-paper/60">
              <Link href="/admin/review" className="hover:text-amber">
                Review
              </Link>
              <Link href="/admin/archive" className="hover:text-amber">
                Archive
              </Link>
              <Link href="/admin/sources" className="hover:text-amber">
                Sources
              </Link>
            </nav>
          </div>
          <Link
            href="/app"
            className="font-mono text-[10px] uppercase tracking-widest2 text-paper/40 hover:text-amber"
          >
            ← Back to DOMAIN
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}
