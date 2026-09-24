import { apiGet } from "@/lib/api/client-server";

export interface GiveawayEntry {
  id: string;
  bingxUid: string;
  email: string;
  telegram: string;
  name: string | null;
  wonAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GiveawayList {
  entries: GiveawayEntry[];
  total: number;
}

export async function listGiveawayEntries(): Promise<GiveawayList> {
  try {
    return (await apiGet<GiveawayList>("/giveaway/admin/entries")) ?? { entries: [], total: 0 };
  } catch {
    return { entries: [], total: 0 };
  }
}
