import { shortLinksRepository } from "./short-links.repository.js";
import type { ShortLinkUpdateInput } from "./short-links.validation.js";

// Small in-memory cache so the redirect middleware doesn't hit the DB on every
// request. TTL is short and admin updates bust the entry immediately, so an
// edit is live well within a minute.
const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { url: string; expiresAt: number }>();

export const shortLinksService = {
  // Resolve a slug to its target URL (cached). Returns null when unknown.
  async getTarget(slug: string): Promise<string | null> {
    const hit = cache.get(slug);
    if (hit && hit.expiresAt > Date.now()) return hit.url;

    const row = await shortLinksRepository.getBySlug(slug);
    if (!row) return null;

    cache.set(slug, { url: row.targetUrl, expiresAt: Date.now() + CACHE_TTL_MS });
    return row.targetUrl;
  },

  // Admin read — current target + metadata for the editor UI.
  get: (slug: string) => shortLinksRepository.getBySlug(slug),

  async update(slug: string, data: ShortLinkUpdateInput) {
    const row = await shortLinksRepository.updateTarget(slug, data.targetUrl);
    cache.set(slug, { url: row.targetUrl, expiresAt: Date.now() + CACHE_TTL_MS });
    return row;
  },
};
