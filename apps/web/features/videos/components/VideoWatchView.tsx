"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useWatchedVideos } from "@/features/videos/hooks/useWatchedVideos";
import {
  categoryLabel,
  embedUrl,
  moduleLabel,
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
      className={`group flex-1 border border-gray-3 bg-black px-4 py-3 transition-colors hover:bg-gray-2 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none ${
        direction === "next" ? "text-right" : ""
      }`}
    >
      <div className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
        {direction === "prev" ? "← Previous" : "Next →"}
      </div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-widest2 text-brand">
        {moduleLabel(index)}
      </div>
      <div className="mt-0.5 truncate font-display text-base text-white group-hover:text-brand">
        {video.title}
      </div>
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
    <div className="stagger mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/app/education/videos"
        className="font-mono text-[10px] uppercase tracking-widest2 text-white/40 transition-colors hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
      >
        ← Video Modules
      </Link>

      <div className="mt-6 aspect-video w-full border border-white/[0.06] bg-black">
        <iframe
          src={embedUrl(video.provider, video.videoId)}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="h-full w-full"
        />
      </div>

      <div className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <span className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
          {moduleLabel(index)}
        </span>
        <span className="border border-gray-3 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-white/60">
          {categoryLabel(video.category)}
        </span>
        {video.duration && (
          <span className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
            {video.duration}
          </span>
        )}
      </div>

      <h1 className="mt-2 font-display text-3xl text-white sm:text-4xl">
        {video.title}
      </h1>

      {video.description && (
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70">
          {video.description}
        </p>
      )}

      <div className="mt-10 flex gap-4">
        <NeighborLink video={prev} index={index - 1} direction="prev" />
        <NeighborLink video={next} index={index + 1} direction="next" />
      </div>
    </div>
  );
}
