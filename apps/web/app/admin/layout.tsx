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
  if (!profile.isAdmin) {
    redirect("/app");
  }
  return (
    <div className="min-h-screen bg-black text-white">
      <a
        href="#admin-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:border focus:border-brand focus:bg-black focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:uppercase focus:tracking-widest2 focus:text-brand"
      >
        Skip to content
      </a>

      {/* Top bar — mirrors landing page nav feel */}
      <nav
        className="sticky top-0 z-40 border-b border-white/20 bg-black/90 backdrop-blur-lg"
        aria-label="Admin navigation"
      >
        <div className="mx-6 flex items-center justify-between py-5 md:mx-[100px]">
          <div className="flex items-center gap-8">
            <Link
              href="/admin/review"
              className="font-mono text-base font-bold text-white transition-opacity hover:opacity-80"
            >
              +vantage
            </Link>
            <div className="hidden h-4 w-px bg-white/20 sm:block" />
            <span className="hidden font-mono text-[10px] uppercase tracking-widest2 text-brand sm:block">
              Desk · Admin
            </span>
          </div>
          <Link
            href="/app"
            className="font-mono text-[10px] uppercase tracking-widest2 text-white/40 transition-colors hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            ← Back to Domain
          </Link>
        </div>
      </nav>

      {/* Section nav — styled like landing page section headers */}
      <div className="w-full overflow-hidden">
        <div className="h-px bg-white/40 line-pulse" />
      </div>
      <div className="mx-6 border-x border-white/20 md:mx-[100px]">
        <div className="flex items-center justify-between px-8 py-4">
          <AdminNav />
          <span className="hidden font-mono text-[10px] uppercase tracking-widest2 text-white/30 sm:block">
            {profile.handle ?? profile.email}
          </span>
        </div>
      </div>
      <div className="w-full overflow-hidden">
        <div className="h-px bg-white/40" />
      </div>

      {/* Content area — framed like landing page sections */}
      <main id="admin-content" className="mx-6 border-x border-white/20 bg-white/[0.02] md:mx-[100px]">
        <div className="px-6 py-8 md:px-12 md:py-12">
          {children}
        </div>
      </main>

      {/* Bottom line */}
      <div className="w-full overflow-hidden">
        <div className="h-px bg-white/40" />
      </div>
    </div>
  );
}
