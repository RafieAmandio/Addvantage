export type VideoProvider = "youtube" | "drive";

export interface VideoModule {
  slug: string;
  title: string;
  description: string;
  category: "analysis" | "session";
  provider: VideoProvider;
  videoId: string;
  duration: string;
  sortOrder: number;
}

export function moduleLabel(index: number): string {
  return `MODULE ${String(index + 1).padStart(2, "0")}`;
}

export function categoryLabel(category: VideoModule["category"]): string {
  return category === "session" ? "SESSION" : "ANALYSIS";
}

export function thumbnailUrl(provider: VideoProvider, videoId: string): string {
  return provider === "drive"
    ? `https://drive.google.com/thumbnail?id=${videoId}&sz=w480`
    : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function embedUrl(provider: VideoProvider, videoId: string): string {
  return provider === "drive"
    ? `https://drive.google.com/file/d/${videoId}/preview`
    : `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
}
