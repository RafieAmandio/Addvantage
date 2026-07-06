import type { VideoModule } from "@/features/videos/types";
import { apiGet } from "@/lib/api/client-server";

export interface VideoModuleAdmin extends VideoModule {
  id: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function listAllVideosForAdmin(): Promise<VideoModuleAdmin[]> {
  try {
    const data = await apiGet<VideoModuleAdmin[]>("/videos/admin");
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getVideoForAdmin(id: string): Promise<VideoModuleAdmin | null> {
  try {
    return await apiGet<VideoModuleAdmin>(`/videos/admin/${encodeURIComponent(id)}`);
  } catch {
    return null;
  }
}
