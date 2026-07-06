"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { DataLabel } from "@/components/ui/Marker";
import { EducationTabs } from "@/features/videos/components/EducationTabs";
import { useWatchedVideos } from "@/features/videos/hooks/useWatchedVideos";
import {
  categoryLabel,
  moduleLabel,
  thumbnailUrl,
  type VideoModule,
} from "@/features/videos/types";

export function VideoModulesHeader() {
  return (
    <div className="border-b border-gray-3 bg-gray-2/30">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <DataLabel>Education</DataLabel>
        <h1 className="mt-2 font-display text-3xl text-white sm:text-4xl md:text-5xl">
          Video <span className="italic text-brand">Modules</span>
        </h1>
        <p className="mt-2 max-w-2xl font-display text-lg text-white/60">
          Recorded market analysis and live session replays from the desk.
          Numbered, curated, and restricted to operators.
        </p>
        <EducationTabs current="videos" />
      </div>
    </div>
  );
}

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
      className="group grid grid-cols-[1fr_auto] items-center gap-4 border-b border-gray-3 bg-black px-4 py-5 transition-colors hover:bg-gray-2 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none sm:grid-cols-[110px_1fr_auto_176px] sm:gap-6 sm:px-6"
    >
      <div className="hidden sm:block">
        <div className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
          {moduleLabel(index)}
        </div>
        {watched && (
          <div className="mt-1 font-mono text-[9px] uppercase tracking-widest2 text-moss">
            ✓ Viewed
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className="font-mono text-[10px] uppercase tracking-widest2 text-brand sm:hidden">
          {moduleLabel(index)}
          {watched && <span className="ml-2 text-moss">✓ Viewed</span>}
        </div>
        <h3
          className={cn(
            "mt-1 truncate font-display text-xl leading-tight transition-colors sm:mt-0 sm:text-2xl",
            watched ? "text-white/60 group-hover:text-white" : "text-white",
          )}
        >
          {video.title}
        </h3>
        {video.description && (
          <p className="mt-1 hidden max-w-xl truncate text-sm text-white/50 md:block">
            {video.description}
          </p>
        )}
      </div>

      <div className="flex flex-col items-end gap-1 font-mono text-[9px] uppercase tracking-widest2">
        <span className="border border-gray-3 px-1.5 py-0.5 text-white/60">
          {categoryLabel(video.category)}
        </span>
        {video.duration && <span className="text-white/40">{video.duration}</span>}
      </div>

      <div className="relative hidden aspect-video overflow-hidden border border-white/[0.06] sm:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnailUrl(video.youtubeId)}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover saturate-50 transition-[filter] duration-200 group-hover:saturate-100"
        />
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          aria-hidden="true"
        >
          <span className="bg-brand px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-black">
            ▶ Play
          </span>
        </div>
      </div>
    </Link>
  );
}

export function RecordingsView({ videos }: { videos: VideoModule[] }) {
  const { slugs: watchedSlugs, hydrated } = useWatchedVideos();

  return (
    <div className="stagger">
      <VideoModulesHeader />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        {videos.length === 0 ? (
          <div className="flex min-h-[30vh] flex-col items-center justify-center gap-2 border border-gray-3 bg-black">
            <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
              No recordings on file
            </div>
            <p className="text-sm text-white/30">
              Modules are declassified here as the desk records them.
            </p>
          </div>
        ) : (
          <div className="border-t border-gray-3">
            {videos.map((v, i) => (
              <VideoRow
                key={v.slug}
                video={v}
                index={i}
                watched={hydrated && watchedSlugs.includes(v.slug)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
