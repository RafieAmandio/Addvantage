import type { NewsListItem } from "@/features/news/queries/news";
import { listPublishedPrimers } from "@/features/education/queries/primers";
import type { Primer } from "@/features/education/types";
import { apiGet } from "@/lib/api/client-server";
import { HASHTAGS, type Hashtag } from "@tradevantage/shared";

export async function listNewsByTag(tag: string): Promise<NewsListItem[]> {
  try {
    const data = await apiGet<NewsListItem[]>(`/tags/${encodeURIComponent(tag)}/news`);
    return data ?? [];
  } catch {
    return [];
  }
}

export async function listPrimersByTag(tag: string): Promise<Primer[]> {
  const all = await listPublishedPrimers();
  return all.filter((p) => p.tags.includes(tag));
}

export type TagCount = { tag: Hashtag; newsCount: number; primerCount: number; total: number };

export async function getTagCounts(): Promise<TagCount[]> {
  try {
    const counts = await apiGet<Record<string, number>>("/tags/counts");
    const primers = await listPublishedPrimers();

    const primerTally = new Map<string, number>();
    for (const p of primers) {
      for (const t of p.tags) {
        primerTally.set(t, (primerTally.get(t) ?? 0) + 1);
      }
    }

    return HASHTAGS.map((tag) => {
      const newsCount = counts[tag] ?? 0;
      const primerCount = primerTally.get(tag) ?? 0;
      return { tag, newsCount, primerCount, total: newsCount + primerCount };
    });
  } catch {
    return HASHTAGS.map((tag) => ({ tag, newsCount: 0, primerCount: 0, total: 0 }));
  }
}
