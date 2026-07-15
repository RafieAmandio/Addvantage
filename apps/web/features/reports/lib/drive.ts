const DRIVE_ID_RE = /^[A-Za-z0-9_-]{25,44}$/;

// Mirrors the API-side normalizer (apps/api reports.validation.ts) so the
// admin form can validate + preview a Drive PDF link before submitting.
export function parseDriveId(input: string): string | null {
  const trimmed = input.trim();
  if (DRIVE_ID_RE.test(trimmed)) return trimmed;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (/(^|\.)(drive|docs)\.google\.com$/.test(url.hostname)) {
    const fromParam = url.searchParams.get("id");
    if (fromParam && DRIVE_ID_RE.test(fromParam)) return fromParam;
    const pathId = url.pathname.match(/\/(?:file\/)?d\/([A-Za-z0-9_-]{25,44})/)?.[1];
    if (pathId) return pathId;
  }
  return null;
}
