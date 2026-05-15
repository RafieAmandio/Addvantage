import { NotFoundError } from "@/core/errors/index.js";
import { channelRepository } from "./channel.repository.js";

export const channelService = {
  async listPublished(opts: { limit: number; offset: number }) {
    const [content, total] = await Promise.all([
      channelRepository.list({ ...opts, includeUnpublished: false }),
      channelRepository.count(false),
    ]);
    return { content, total };
  },

  async listAll(opts: { limit: number; offset: number }) {
    const [content, total] = await Promise.all([
      channelRepository.list({ ...opts, includeUnpublished: true }),
      channelRepository.count(true),
    ]);
    return { content, total };
  },

  async getById(id: string) {
    const post = await channelRepository.findById(id);
    if (!post) throw new NotFoundError("Channel post not found");
    return post;
  },

  async create(data: {
    body: string;
    author?: string;
    imageUrl?: string;
    tags?: string[];
    pinned?: boolean;
    published?: boolean;
  }) {
    return channelRepository.create(data);
  },

  async update(
    id: string,
    data: {
      body?: string;
      author?: string;
      imageUrl?: string | null;
      tags?: string[];
      pinned?: boolean;
      published?: boolean;
    },
  ) {
    await this.getById(id);
    return channelRepository.update(id, data);
  },

  async delete(id: string) {
    await this.getById(id);
    return channelRepository.delete(id);
  },
};
