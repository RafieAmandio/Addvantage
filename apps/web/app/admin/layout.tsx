import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { AdminNav } from "./AdminNav";

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
    redirect("/app");
  }
  return (
    <div className="min-h-screen bg-black">
      <a
        href="#admin-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:border focus:border-brand focus:bg-black focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:uppercase focus:tracking-widest2 focus:text-brand"
      >
        Skip to content
      </a>
      <nav className="border-b border-gray-3 bg-gray-2/40" aria-label="Admin navigation">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-6">
            <span className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
              DESK · ADMIN
            </span>
            <AdminNav />
          </div>
          <Link
            href="/app"
            className="font-mono text-[10px] uppercase tracking-widest2 text-white/40 transition-colors hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            ← Back to DOMAIN
          </Link>
        </div>
      </nav>
      <main id="admin-content">{children}</main>
    </div>
  );
}
