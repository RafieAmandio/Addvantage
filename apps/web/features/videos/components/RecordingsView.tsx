"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Panel } from "@/components/ui/Panel";
import { TextTabs } from "@/components/ui/TextTabs";
import { EducationTabs } from "@/features/videos/components/EducationTabs";
import { useWatchedVideos } from "@/features/videos/hooks/useWatchedVideos";
import {
  categoryLabel,
  thumbnailUrl,
  type VideoModule,
} from "@/features/videos/types";

function VideoRow({
  video,
  index,
  watched,
}: {
  video: VideoModule;
  index: number;
  watched: boolean;
}) {
  return (
    <Link
      href={`/app/education/videos/${video.slug}`}
      className="group flex items-center gap-4 py-4 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
    >
      <div className="relative hidden aspect-video w-40 shrink-0 overflow-hidden rounded-lg bg-raised sm:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnailUrl(video.provider, video.videoId)}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover saturate-50 transition-[filter] duration-200 group-hover:saturate-100"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">
          Module {String(index + 1).padStart(2, "0")}
          <span className="px-1.5 text-white/20">/</span>
          {categoryLabel(video.category)}
          {watched && <span className="ml-2 text-up">Viewed</span>}
        </p>
        <h3
          className={cn(
            "mt-1 truncate text-[17px] font-medium leading-6 transition-colors group-hover:text-white",
            watched ? "text-white/55" : "text-white",
          )}
        >
          {video.title}
        </h3>
        {video.description && (
          <p className="mt-1 line-clamp-2 text-[14px] leading-[21px] text-white/55">{video.description}</p>
        )}
      </div>

      {video.duration && (
        <span className="shrink-0 font-num text-[20px] font-semibold text-white/75">{video.duration}</span>
      )}
    </Link>
  );
}

const CATEGORY_TABS = [
  { id: "analysis", label: "Modules" },
  { id: "session", label: "Live Sessions" },
] as const;

export function RecordingsView({ videos }: { videos: VideoModule[] }) {
  const { slugs: watchedSlugs, hydrated } = useWatchedVideos();
  const [tab, setTab] = useState<VideoModule["category"]>("analysis");
  const shown = videos.filter((v) => v.category === tab);
  const watchedCount = hydrated ? videos.filter((v) => watchedSlugs.includes(v.slug)).length : 0;
  const pct = videos.length ? Math.round((watchedCount / videos.length) * 100) : 0;

  return (
    <div className="space-y-4 px-4 pb-10 sm:px-6">
      <EducationTabs current="videos" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel
          title="Recordings"
          sub="Market analysis and live session replays from the desk"
          action={<TextTabs options={CATEGORY_TABS} value={tab} onChange={setTab} label="Video category" />}
        >
          {shown.length === 0 ? (
            <p className="py-10 text-center text-[14px] text-white/40">
              No recordings yet. Modules appear here as the desk records them.
            </p>
          ) : (
            <div className="-my-1 divide-y divide-white/[0.07]">
              {shown.map((v, i) => (
                <VideoRow key={v.slug} video={v} index={i} watched={hydrated && watchedSlugs.includes(v.slug)} />
              ))}
            </div>
          )}
        </Panel>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
          <Panel title="Your progress" sub="Watched on this device">
            <p className="font-num text-[40px] font-semibold leading-[44px] text-white">
              {watchedCount}
              <span className="text-white/30"> / {videos.length}</span>
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
              <div className="h-full bg-brand" style={{ width: `${pct}%` }} />
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
