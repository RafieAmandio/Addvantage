export interface ClassReport {
  slug: string;
  title: string;
  summary: string;
  author: string;
  driveId: string;
  publishedAt: string | null;
  sortOrder: number;
}

export function reportLabel(index: number): string {
  return `REPORT ${String(index + 1).padStart(2, "0")}`;
}

export function thumbnailUrl(driveId: string): string {
  return `https://drive.google.com/thumbnail?id=${driveId}&sz=w480`;
}

// Google Drive renders PDFs through the same /preview iframe used for videos.
export function pdfEmbedUrl(driveId: string): string {
  return `https://drive.google.com/file/d/${driveId}/preview`;
}

export function formatReportDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
