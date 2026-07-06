"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import {
  createVideo,
  updateVideo,
  deleteVideo,
  type VideoActionState,
} from "@/features/videos/admin/actions";
import type { VideoModuleAdmin } from "@/features/videos/admin/queries";
import { parseVideoRef } from "@/features/videos/lib/youtube";
import { thumbnailUrl } from "@/features/videos/types";
import { cn } from "@/lib/cn";

const INITIAL: VideoActionState = { ok: false };

const inputCls =
  "w-full border border-gray-3 bg-black px-3 py-2 text-sm text-white placeholder:text-white/20 focus:border-brand focus:outline-none";
const labelCls =
  "mb-1 block font-mono text-[10px] uppercase tracking-widest2 text-white/40";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="border border-brand bg-brand px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-black transition-colors hover:bg-white disabled:opacity-40 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
    >
      {pending ? "…" : label}
    </button>
  );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function VideoEditorForm({ video }: { video: VideoModuleAdmin | null }) {
  const action = video ? updateVideo.bind(null, video.id) : createVideo;
  const [state, formAction] = useFormState(action, INITIAL);
  const [videoInput, setVideoInput] = useState(video?.videoId ?? "");
  const [slug, setSlug] = useState(video?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!video);

  const previewRef = parseVideoRef(videoInput);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <form action={formAction} className="border border-brand/40 bg-black p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="v-title" className={labelCls}>
              Title
            </label>
            <input
              id="v-title"
              name="title"
              required
              maxLength={160}
              defaultValue={video?.title ?? ""}
              onChange={(e) => {
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              className={inputCls}
              placeholder="London Session Replay — W27"
            />
          </div>

          <div>
            <label htmlFor="v-slug" className={labelCls}>
              Slug
            </label>
            <input
              id="v-slug"
              name="slug"
              required
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              className={cn(inputCls, "font-mono")}
              placeholder="london-session-w27"
            />
          </div>

          <div>
            <label htmlFor="v-category" className={labelCls}>
              Category
            </label>
            <select
              id="v-category"
              name="category"
              defaultValue={video?.category ?? "analysis"}
              className={inputCls}
            >
              <option value="analysis">Analysis</option>
              <option value="session">Session</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="v-video" className={labelCls}>
              YouTube / Drive URL or ID
            </label>
            <input
              id="v-video"
              name="video"
              required
              value={videoInput}
              onChange={(e) => setVideoInput(e.target.value)}
              className={cn(inputCls, "font-mono")}
              placeholder="https://youtu.be/dQw4w9WgXcQ"
            />
          </div>

          <div>
            <label htmlFor="v-duration" className={labelCls}>
              Duration
            </label>
            <input
              id="v-duration"
              name="duration"
              maxLength={16}
              defaultValue={video?.duration ?? ""}
              className={cn(inputCls, "font-mono")}
              placeholder="42:10"
            />
          </div>

          <div>
            <label htmlFor="v-sort" className={labelCls}>
              Sort order
            </label>
            <input
              id="v-sort"
              name="sortOrder"
              type="number"
              min={0}
              defaultValue={video?.sortOrder ?? 0}
              className={cn(inputCls, "font-mono")}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="v-description" className={labelCls}>
              Description
            </label>
            <textarea
              id="v-description"
              name="description"
              rows={4}
              maxLength={4000}
              defaultValue={video?.description ?? ""}
              className={inputCls}
              placeholder="What the desk covers in this module…"
            />
          </div>

          <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest2 text-white/60 sm:col-span-2">
            <input
              type="checkbox"
              name="published"
              defaultChecked={video?.published ?? false}
              className="h-4 w-4 accent-[#FFD400]"
            />
            Published
          </label>
        </div>

        {state.error && (
          <p className="mt-4 font-mono text-[10px] uppercase tracking-widest2 text-blood-bright">
            {state.error}
          </p>
        )}
        {state.ok && (
          <p className="mt-4 font-mono text-[10px] uppercase tracking-widest2 text-moss">
            Saved
          </p>
        )}

        <div className="mt-6 flex items-center gap-3">
          <SubmitButton label={video ? "Save changes" : "Create video"} />
          <Link
            href="/admin/videos"
            className="border border-white/[0.1] px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-white/60 transition-colors hover:border-white/20 hover:text-white focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            Cancel
          </Link>
        </div>
      </form>

      <div>
        <div className={labelCls}>Thumbnail preview</div>
        <div className="aspect-video border border-white/[0.06] bg-black-2">
          {previewRef ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnailUrl(previewRef.provider, previewRef.videoId)}
              alt="Video thumbnail preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center font-mono text-[10px] uppercase tracking-widest2 text-white/20">
              {videoInput ? "Invalid video link" : "Paste a link to preview"}
            </div>
          )}
        </div>
        {previewRef && (
          <div className="mt-2 font-mono text-[10px] text-white/40">
            {previewRef.provider}: {previewRef.videoId}
          </div>
        )}

        {video && (
          <form
            action={deleteVideo.bind(null, video.id)}
            className="mt-8 border-t border-gray-3 pt-4"
          >
            <button
              type="submit"
              className="border border-blood-bright/50 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-blood-bright transition-colors hover:bg-blood-bright hover:text-black focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
            >
              Delete video
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
