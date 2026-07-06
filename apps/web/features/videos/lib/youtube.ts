import type { VideoProvider } from "@/features/videos/types";

const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;
const DRIVE_ID_RE = /^[A-Za-z0-9_-]{25,44}$/;

export type VideoRef = { provider: VideoProvider; videoId: string };

// Mirrors the API-side normalizer (apps/api videos.validation.ts) so the
// admin form can preview thumbnails before submitting.
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
    const match = url.pathname.match(/\/(?:file\/)?d\/([A-Za-z0-9_-]{25,44})/);
    if (match) return { provider: "drive", videoId: match[1] };
    return null;
  }

  return null;
}
