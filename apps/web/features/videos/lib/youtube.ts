const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;

// Mirrors the API-side normalizer (apps/api videos.validation.ts) so the
// admin form can preview thumbnails before submitting.
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
