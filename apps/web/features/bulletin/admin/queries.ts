import { apiGet } from "@/lib/api/client-server";
import type { Bulletin } from "../types";

export async function listBulletinsForAdmin(): Promise<Bulletin[]> {
  try {
    return (await apiGet<Bulletin[]>("/bulletin")) ?? [];
  } catch {
    return [];
  }
}

export async function getBulletinForAdmin(id: string): Promise<Bulletin | null> {
  try {
    return await apiGet<Bulletin>(`/bulletin/admin/${encodeURIComponent(id)}`);
  } catch {
    return null;
  }
}
