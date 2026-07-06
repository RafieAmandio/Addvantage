export interface VideoModule {
  slug: string;
  title: string;
  description: string;
  category: "analysis" | "session";
  youtubeId: string;
  duration: string;
  sortOrder: number;
}

export function moduleLabel(index: number): string {
  return `MODULE ${String(index + 1).padStart(2, "0")}`;
}

export function categoryLabel(category: VideoModule["category"]): string {
  return category === "session" ? "SESSION" : "ANALYSIS";
}

export function thumbnailUrl(youtubeId: string): string {
  return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
}
