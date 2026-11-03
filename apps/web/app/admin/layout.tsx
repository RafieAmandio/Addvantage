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
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-brand focus:px-4 focus:py-2 focus:text-[13px] focus:font-semibold focus:text-black"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur">
        <div className="flex items-center justify-between gap-4 px-4 pt-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/admin/review" className="transition-opacity hover:opacity-80" aria-label="Admin home">
              <img src="/logo-vantage.png" alt="vantage" className="h-7 w-auto" />
            </Link>
            <span className="rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-black">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-[13px] text-white/40 sm:block">{profile.handle ?? profile.email}</span>
            <Link
              href="/app"
              className="rounded-full border border-white/[0.14] px-3.5 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
            >
              Back to app
            </Link>
          </div>
        </div>
        <div className="px-4 py-3 sm:px-6">
          <AdminNav />
        </div>
      </header>

      <main id="admin-content" className="px-4 pb-10 pt-2 sm:px-6">
        {children}
      </main>
    </div>
  );
}
