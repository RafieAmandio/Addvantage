import { z } from "zod";

const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;
const DRIVE_ID_RE = /^[A-Za-z0-9_-]{25,44}$/;

export type VideoRef = { provider: "youtube" | "drive"; videoId: string };

/**
 * Accepts a bare video ID or any common YouTube / Google Drive URL form and
 * returns the provider + bare ID. YouTube: watch?v=, youtu.be/, shorts/,
 * embed/, live/. Drive: file/d/{id}, open?id=, uc?id=. Returns null when no
 * ID can be extracted.
 */
export function parseVideoRef(input: string): VideoRef | null {
  const trimmed = input.trim();
  if (YOUTUBE_ID_RE.test(trimmed)) return { provider: "youtube", videoId: trimmed };
  if (DRIVE_ID_RE.test(trimmed)) return { provider: "drive", videoId: trimmed };

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (/(^|\.)((youtube(-nocookie)?\.com)|(youtu\.be))$/.test(url.hostname)) {
    const fromParam = url.searchParams.get("v");
    if (fromParam && YOUTUBE_ID_RE.test(fromParam)) {
      return { provider: "youtube", videoId: fromParam };
    }
    const segments = url.pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1];
    if (last && YOUTUBE_ID_RE.test(last)) return { provider: "youtube", videoId: last };
    return null;
  }

  if (/(^|\.)(drive|docs)\.google\.com$/.test(url.hostname)) {
    const fromParam = url.searchParams.get("id");
    if (fromParam && DRIVE_ID_RE.test(fromParam)) {
      return { provider: "drive", videoId: fromParam };
    }
    const pathId = url.pathname.match(/\/(?:file\/)?d\/([A-Za-z0-9_-]{25,44})/)?.[1];
    if (pathId) return { provider: "drive", videoId: pathId };
    return null;
  }

  return null;
}

const videoField = z
  .string()
  .min(1)
  .transform((val, ctx) => {
    const ref = parseVideoRef(val);
    if (!ref) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Not a valid YouTube / Google Drive URL or video ID",
      });
      return z.NEVER;
    }
    return ref;
  });

export const videoCreateSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case"),
  title: z.string().min(1).max(160),
  description: z.string().max(4000).default(""),
  category: z.enum(["analysis", "session"]).default("analysis"),
  video: videoField,
  duration: z.string().max(16).default(""),
  sortOrder: z.number().int().min(0).default(0),
  published: z.boolean().default(false),
});

export const videoUpdateSchema = videoCreateSchema.partial();

export type VideoCreateInput = z.infer<typeof videoCreateSchema>;
export type VideoUpdateInput = z.infer<typeof videoUpdateSchema>;
