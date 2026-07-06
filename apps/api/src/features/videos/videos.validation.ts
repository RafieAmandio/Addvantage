import { z } from "zod";

const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;

/**
 * Accepts a bare 11-char YouTube ID or any common YouTube URL form
 * (watch?v=, youtu.be/, shorts/, embed/, live/) and returns the bare ID.
 * Returns null when no ID can be extracted.
 */
export function extractYoutubeId(input: string): string | null {
  const trimmed = input.trim();
  if (YOUTUBE_ID_RE.test(trimmed)) return trimmed;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (!/(^|\.)((youtube(-nocookie)?\.com)|(youtu\.be))$/.test(url.hostname)) return null;

  const fromParam = url.searchParams.get("v");
  if (fromParam && YOUTUBE_ID_RE.test(fromParam)) return fromParam;

  const segments = url.pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1];
  if (last && YOUTUBE_ID_RE.test(last)) return last;

  return null;
}

const youtubeIdField = z
  .string()
  .min(1)
  .transform((val, ctx) => {
    const id = extractYoutubeId(val);
    if (!id) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Not a valid YouTube URL or video ID" });
      return z.NEVER;
    }
    return id;
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
  youtubeId: youtubeIdField,
  duration: z.string().max(16).default(""),
  sortOrder: z.number().int().min(0).default(0),
  published: z.boolean().default(false),
});

export const videoUpdateSchema = videoCreateSchema.partial();
