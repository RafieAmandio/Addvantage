import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { listAllVideosForAdmin } from "@/features/videos/admin/queries";
import { togglePublished } from "@/features/videos/admin/actions";
import { categoryLabel, thumbnailUrl } from "@/features/videos/types";

export const metadata: Metadata = { title: "Videos" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminVideosPage() {
  await requireAdmin();
  const videos = await listAllVideosForAdmin();

  return (
    <div className="stagger mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="font-display text-4xl text-white">
          Video <span className="italic text-brand">modules</span>
        </h1>
        <div className="flex items-center gap-3">
          <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
            {videos.length} total
          </div>
          <Link
            href="/admin/videos/new"
            className="border border-brand bg-brand px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-black transition-colors hover:bg-white focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            + New video
          </Link>
        </div>
      </div>

      {videos.length === 0 ? (
        <div className="flex min-h-[20vh] items-center justify-center border border-gray-3 bg-black font-mono text-[10px] uppercase tracking-widest2 text-white/40">
          No videos yet — create the first module
        </div>
      ) : (
        <div className="border-t border-gray-3">
          {videos.map((v) => (
            <div
              key={v.id}
              className="grid grid-cols-[96px_1fr_auto_auto] items-center gap-4 border-b border-gray-3 bg-black px-4 py-3 sm:gap-6 sm:px-6"
            >
              <div className="aspect-video overflow-hidden border border-white/[0.06]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbnailUrl(v.youtubeId)}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <Link
                  href={`/admin/videos/${v.id}`}
                  className="truncate font-display text-lg text-white transition-colors hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
                >
                  {v.title}
                </Link>
                <div className="mt-0.5 flex flex-wrap gap-x-3 font-mono text-[9px] uppercase tracking-widest2 text-white/40">
                  <span>{categoryLabel(v.category)}</span>
                  {v.duration && <span>{v.duration}</span>}
                  <span>#{v.sortOrder}</span>
                  <span className="text-white/25">{v.slug}</span>
                </div>
              </div>
              <form action={togglePublished.bind(null, v.id, !v.published)}>
                <button
                  type="submit"
                  className={
                    v.published
                      ? "border border-moss/50 px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-moss transition-colors hover:bg-moss/10 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
                      : "border border-gray-3 px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-white/40 transition-colors hover:border-white/30 hover:text-white focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
                  }
                >
                  {v.published ? "● Published" : "○ Draft"}
                </button>
              </form>
              <Link
                href={`/admin/videos/${v.id}`}
                className="font-mono text-[10px] uppercase tracking-widest2 text-white/40 transition-colors hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
              >
                Edit →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
