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
    // Logged-in but non-admin: bounce to the operator dashboard rather than
    // render a dead "FORBIDDEN" page. Avoids the impression that the admin
    // surface even exists for ordinary users, and keeps URLs in /app/* on
    // accidental link follows.
    redirect("/app");
  }
  return (
    <div className="min-h-screen bg-ink">
      <div className="border-b border-ink-3 bg-ink-2/40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <span className="font-mono text-[10px] uppercase tracking-widest2 text-lime">
              DESK · ADMIN
            </span>
            <nav className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest2 text-paper/60">
              <Link href="/admin/review" className="hover:text-lime">
                Review
              </Link>
              <Link href="/admin/archive" className="hover:text-lime">
                Archive
              </Link>
              <Link href="/admin/plans" className="hover:text-lime">
                Plans
              </Link>
              <Link href="/admin/sources" className="hover:text-lime">
                Sources
              </Link>
            </nav>
          </div>
          <Link
            href="/app"
            className="font-mono text-[10px] uppercase tracking-widest2 text-paper/40 hover:text-lime"
          >
            ← Back to DOMAIN
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}
