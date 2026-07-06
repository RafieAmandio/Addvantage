import { ForbiddenError, NotFoundError } from "@/core/errors/index.js";
import { videosRepository } from "./videos.repository.js";

const DEFAULT_LIMIT = 100;

// Video modules are VIP-only. The gate lives here (not client-side like
// education's `locked` flag) so youtube_id never reaches free-tier clients.
async function assertVipAccess(userId: string) {
  const profile = await videosRepository.getProfileAccess(userId);
  if (!profile || (profile.tier !== "vip" && !profile.isAdmin)) {
    throw new ForbiddenError("VIP access required");
  }
}

export const videosService = {
  async listPublished(userId: string, limit?: number) {
    await assertVipAccess(userId);
    return videosRepository.listPublished(limit ?? DEFAULT_LIMIT);
  },

  async getBySlug(userId: string, slug: string) {
    await assertVipAccess(userId);
    const video = await videosRepository.findPublishedBySlug(slug);
    if (!video || !video.published) throw new NotFoundError("Video not found");
    const { published: _, ...rest } = video;
    return rest;
  },

  listAll: () => videosRepository.listAll(),

  async getById(id: string) {
    const video = await videosRepository.findById(id);
    if (!video) throw new NotFoundError("Video not found");
    return video;
  },

  create: (data: Parameters<typeof videosRepository.create>[0]) =>
    videosRepository.create(data),

  async update(id: string, data: Parameters<typeof videosRepository.update>[1]) {
    await videosService.getById(id);
    return videosRepository.update(id, data);
  },

  async delete(id: string) {
    await videosService.getById(id);
    await videosRepository.delete(id);
  },
};
