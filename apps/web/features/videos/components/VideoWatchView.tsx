"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useWatchedVideos } from "@/features/videos/hooks/useWatchedVideos";
import { Panel } from "@/components/ui/Panel";
import { cn } from "@/lib/cn";
import {
  categoryLabel,
  embedUrl,
  type VideoModule,
} from "@/features/videos/types";

function NeighborLink({
  video,
  index,
  direction,
}: {
  video: VideoModule | null;
  index: number;
  direction: "prev" | "next";
}) {
  if (!video) return <div className="flex-1" />;
  return (
    <Link
      href={`/app/education/videos/${video.slug}`}
      className={cn(
        "group min-w-0 flex-1 rounded-2xl bg-panel px-5 py-4 transition-colors hover:bg-raised focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none",
        direction === "next" && "text-right",
      )}
    >
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">
        {direction === "prev" ? "← Previous" : "Next →"}
        <span className="px-1.5 text-white/20">/</span>
        Module {String(index + 1).padStart(2, "0")}
      </p>
      <p className="mt-1 truncate text-[15px] font-medium text-white">{video.title}</p>
    </Link>
  );
}

export function VideoWatchView({
  video,
  index,
  prev,
  next,
}: {
  video: VideoModule;
  index: number;
  prev: VideoModule | null;
  next: VideoModule | null;
}) {
  const { markWatched } = useWatchedVideos();

  useEffect(() => {
    markWatched(video.slug);
  }, [video.slug, markWatched]);

  return (
    <div className="space-y-4 px-4 pb-10 sm:px-6">
      <Link
        href="/app/education"
        className="inline-block text-[13px] font-medium text-white/55 transition-colors hover:text-white focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
      >
        ← Video modules
      </Link>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
          <iframe
            src={embedUrl(video.provider, video.videoId)}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="h-full w-full"
          />
        </div>

        <Panel as="div" className="lg:self-start">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">
            Module {String(index + 1).padStart(2, "0")}
            <span className="px-1.5 text-white/20">/</span>
            {categoryLabel(video.category)}
          </p>
          <h1 className="mt-2 text-[22px] font-semibold leading-7 text-white">{video.title}</h1>
          {video.duration && <p className="mt-2 font-num text-[24px] font-semibold text-white/75">{video.duration}</p>}
          {video.description && (
            <p className="mt-3 text-[14px] leading-[21px] text-white/55">{video.description}</p>
          )}
        </Panel>
      </div>

      <div className="flex gap-4">
        <NeighborLink video={prev} index={index - 1} direction="prev" />
        <NeighborLink video={next} index={index + 1} direction="next" />
      </div>
    </div>
  );
}
