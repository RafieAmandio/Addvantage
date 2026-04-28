import type { Primer } from "@/features/education/types";
import { apiGet } from "@/lib/api/client-server";

export async function listPublishedPrimers(
  input: { limit?: number } = {},
): Promise<Primer[]> {
  try {
    const limit = input.limit ?? 100;
    const data = await apiGet<Primer[]>(`/education?limit=${limit}`);
    return data ?? [];
  } catch {
    return [];
  }
}
