export interface ClassReport {
  slug: string;
  title: string;
  summary: string;
  author: string;
  driveId: string;
  publishedAt: string | null;
}

// Google Drive renders link-shared PDFs through the same /preview iframe used for videos.
export const pdfEmbedUrl = (driveId: string) => `https://drive.google.com/file/d/${driveId}/preview`;
export const pdfViewUrl = (driveId: string) => `https://drive.google.com/file/d/${driveId}/view`;

export function reportDate(iso: string | null): { day: string; month: string; full: string } | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const fmt = (o: Intl.DateTimeFormatOptions) => d.toLocaleDateString("en-GB", { timeZone: "Asia/Jakarta", ...o });
  return {
    day: fmt({ day: "2-digit" }),
    month: fmt({ month: "short", year: "numeric" }),
    full: fmt({ weekday: "short", day: "2-digit", month: "short", year: "numeric" }),
  };
}
