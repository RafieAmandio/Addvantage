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
      <div className="border-b border-gray-3 bg-gray-2/40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-6">
            <span className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
              DESK · ADMIN
            </span>
            <AdminNav />
          </div>
          <Link
            href="/app"
            className="font-mono text-[10px] uppercase tracking-widest2 text-white/40 transition-colors hover:text-brand"
          >
            ← Back to DOMAIN
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}
