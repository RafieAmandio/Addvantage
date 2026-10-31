import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { listAllVideosForAdmin } from "@/features/videos/admin/queries";
import { togglePublished } from "@/features/videos/admin/actions";
import { categoryLabel, thumbnailUrl } from "@/features/videos/types";
import { Panel } from "@/components/ui/Panel";

export const metadata: Metadata = { title: "Videos" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminVideosPage() {
  await requireAdmin();
  const videos = await listAllVideosForAdmin();
  const published = videos.filter((v) => v.published).length;

  return (
    <div className="space-y-4">
      <Panel
        title="Video modules"
        sub={`${videos.length} total · ${published} published · ${videos.length - published} draft`}
        action={
          <Link
            href="/admin/videos/new"
            className="inline-flex h-9 items-center rounded-full bg-brand px-4 text-[13px] font-semibold text-black transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            New video
          </Link>
        }
      >
        {videos.length === 0 ? (
          <p className="py-10 text-center text-[14px] text-white/40">No videos yet. Create the first module.</p>
        ) : (
          <div className="-mx-5 divide-y divide-white/[0.07] border-t border-white/[0.07]">
            {videos.map((v) => (
              <div
                key={v.id}
                className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-x-4 gap-y-2 px-5 py-3 sm:grid-cols-[96px_minmax(0,1fr)_auto]"
              >
                <div className="aspect-video overflow-hidden rounded-lg bg-raised">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumbnailUrl(v.provider, v.videoId)} alt="" loading="lazy" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0">
                  <Link
                    href={`/admin/videos/${v.id}`}
                    className="block truncate text-[15px] font-medium text-white transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
                  >
                    {v.title}
                  </Link>
                  <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3 text-[12px] text-white/55">
                    <span>{categoryLabel(v.category)}</span>
                    {v.duration && <span className="font-num text-[14px] font-semibold">{v.duration}</span>}
                    <span className="font-num text-[14px] font-semibold text-white/40">#{v.sortOrder}</span>
                    <span className="truncate text-white/30">{v.slug}</span>
                  </div>
                </div>
                <div className="col-start-2 flex items-center gap-2 sm:col-start-auto">
                  <form action={togglePublished.bind(null, v.id, !v.published)}>
                    <button
                      type="submit"
                      title={v.published ? "Unpublish" : "Publish"}
                      className={
                        "rounded-full border border-white/[0.14] px-3 py-1 text-[12px] font-medium transition-colors hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand " +
                        (v.published ? "text-up" : "text-white/55")
                      }
                    >
                      {v.published ? "Published" : "Draft"}
                    </button>
                  </form>
                  <Link
                    href={`/admin/videos/${v.id}`}
                    className="rounded-full border border-white/[0.14] px-3 py-1 text-[12px] font-medium text-white transition-colors hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
