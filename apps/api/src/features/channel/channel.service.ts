import { NotFoundError } from "@/core/errors/index.js";
import { channelRepository } from "./channel.repository.js";

export const channelService = {
  // ─── threads ─────────────────────────────────────────────────────────

  async listThreads() {
    return channelRepository.listThreads();
  },

  async getThreadById(id: string) {
    const thread = await channelRepository.findThreadById(id);
    if (!thread) throw new NotFoundError("Thread not found");
    return thread;
  },

  async createThread(data: { title: string; description?: string }) {
    return channelRepository.createThread(data);
  },

  async updateThread(id: string, data: { title?: string; description?: string | null; sortOrder?: number }) {
    await this.getThreadById(id);
    return channelRepository.updateThread(id, data);
  },

  async deleteThread(id: string) {
    await this.getThreadById(id);
    return channelRepository.deleteThread(id);
  },

  // ─── posts ───────────────────────────────────────────────────────────

  async listPublished(opts: { limit: number; offset: number; threadId?: string }) {
    const [content, total] = await Promise.all([
      channelRepository.list({ ...opts, includeUnpublished: false }),
      channelRepository.count(false, opts.threadId),
    ]);
    return { content, total };
  },

  async listAll(opts: { limit: number; offset: number; threadId?: string }) {
    const [content, total] = await Promise.all([
      channelRepository.list({ ...opts, includeUnpublished: true }),
      channelRepository.count(true, opts.threadId),
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
    threadId?: string | null;
  }) {
    if (data.threadId) await this.getThreadById(data.threadId);
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
      threadId?: string | null;
    },
  ) {
    await this.getById(id);
    if (data.threadId) await this.getThreadById(data.threadId);
    return channelRepository.update(id, data);
  },

  async delete(id: string) {
    await this.getById(id);
    return channelRepository.delete(id);
  },
};
