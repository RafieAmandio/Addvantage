import type { VideoModule } from "@/features/videos/types";
import { isMockMode } from "@/lib/config/public";
import { videoModules as mockVideoModules } from "@/features/videos/mock";
import { apiGet } from "@/lib/api/client-server";

export async function listVideos(): Promise<VideoModule[]> {
  if (isMockMode()) return mockVideoModules;
  try {
    const data = await apiGet<VideoModule[]>("/videos");
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getVideo(slug: string): Promise<VideoModule | null> {
  if (isMockMode()) return mockVideoModules.find((v) => v.slug === slug) ?? null;
  try {
    return await apiGet<VideoModule>(`/videos/${encodeURIComponent(slug)}`);
  } catch {
    return null;
  }
}
