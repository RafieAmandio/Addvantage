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
    <div className="min-h-screen bg-black">
      <div className="border-b border-gray-3 bg-gray-2/40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <span className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
              DESK · ADMIN
            </span>
            <nav className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest2 text-white/60">
              <Link href="/admin/review" className="hover:text-brand">
                Review
              </Link>
              <Link href="/admin/archive" className="hover:text-brand">
                Archive
              </Link>
              <Link href="/admin/plans" className="hover:text-brand">
                Plans
              </Link>
              <Link href="/admin/sources" className="hover:text-brand">
                Sources
              </Link>
              <Link href="/admin/logs" className="hover:text-brand">
                Logs
              </Link>
            </nav>
          </div>
          <Link
            href="/app"
            className="font-mono text-[10px] uppercase tracking-widest2 text-white/40 hover:text-brand"
          >
            ← Back to DOMAIN
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}
