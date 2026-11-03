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
import { Panel } from "@/components/ui/Panel";

const INITIAL: VideoActionState = { ok: false };

const inputCls =
  "h-11 w-full rounded-xl bg-raised px-4 text-[15px] text-white outline-none ring-1 ring-white/[0.08] placeholder:text-white/25 focus-visible:ring-brand";
const textareaCls =
  "w-full resize-y rounded-xl bg-raised px-4 py-3 text-[15px] leading-[22px] text-white outline-none ring-1 ring-white/[0.08] placeholder:text-white/25 focus-visible:ring-brand";
const labelCls = "mb-2 block text-[13px] font-medium text-white/70";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="inline-flex h-11 items-center justify-center rounded-full bg-brand px-5 text-[14px] font-semibold text-black transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      {pending ? "Saving" : label}
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
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <form action={formAction} className="min-w-0 rounded-2xl bg-panel p-5">
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
              placeholder="London Session Replay, W27"
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
              className={inputCls}
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
              className={inputCls}
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
              className={inputCls}
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
              className={cn(inputCls, "font-num text-[17px]")}
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
              className={textareaCls}
              placeholder="What the desk covers in this module"
            />
          </div>

          <label className="flex items-center gap-2.5 text-[14px] text-white/90 sm:col-span-2">
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
          <p className="mt-4 text-[13px] text-down">
            {state.error}
          </p>
        )}
        {state.ok && (
          <p className="mt-4 text-[13px] text-up">
            Saved
          </p>
        )}

        <div className="mt-6 flex items-center gap-3">
          <SubmitButton label={video ? "Save changes" : "Create video"} />
          <Link
            href="/admin/videos"
            className="inline-flex h-11 items-center rounded-full border border-white/[0.14] px-5 text-[14px] font-medium text-white transition-colors hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
          >
            Cancel
          </Link>
        </div>
      </form>

      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <Panel title="Thumbnail preview">
          <div className="aspect-video overflow-hidden rounded-xl bg-raised">
            {previewRef ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbnailUrl(previewRef.provider, previewRef.videoId)}
                alt="Video thumbnail preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[13px] text-white/30">
                {videoInput ? "Invalid video link" : "Paste a link to preview"}
              </div>
            )}
          </div>
          {previewRef && (
            <p className="mt-2 text-[13px] text-white/55">
              <span className="capitalize">{previewRef.provider}</span>: {previewRef.videoId}
            </p>
          )}
        </Panel>

        {video && (
          <Panel title="Remove video" sub="Deletes the module for every member.">
            <form action={deleteVideo.bind(null, video.id)}>
              <button
                type="submit"
                className="inline-flex h-11 w-full items-center justify-center rounded-full border border-white/[0.14] text-[14px] font-medium text-down transition-colors hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
              >
                Delete video
              </button>
            </form>
          </Panel>
        )}
      </aside>
    </div>
  );
}
