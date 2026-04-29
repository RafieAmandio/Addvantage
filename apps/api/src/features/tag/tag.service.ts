import { HASHTAGS } from "@tradevantage/shared";
import { tagRepository } from "./tag.repository.js";

export type TagCount = {
  tag: string;
  newsCount: number;
  primerCount: number;
  total: number;
};

export const tagService = {
  async getCounts(): Promise<TagCount[]> {
    const [newsRows, primerRows] = await Promise.all([
      tagRepository.listApprovedNewsTags(),
      tagRepository.listPublishedPrimerTags(),
    ]);

    const tally = new Map<string, { news: number; primers: number }>();
    for (const tag of HASHTAGS) tally.set(tag, { news: 0, primers: 0 });

    for (const row of newsRows) {
      for (const t of row.tags) {
        const entry = tally.get(t);
        if (entry) entry.news++;
      }
    }

    for (const row of primerRows) {
      for (const t of row.tags) {
        const entry = tally.get(t);
        if (entry) entry.primers++;
      }
    }

    return HASHTAGS.map((tag) => {
      const entry = tally.get(tag) ?? { news: 0, primers: 0 };
      return {
        tag,
        newsCount: entry.news,
        primerCount: entry.primers,
        total: entry.news + entry.primers,
      };
    });
  },

  async listNewsByTag(tag: string, limit: number) {
    return tagRepository.listNewsByTag(tag, limit);
  },
};
