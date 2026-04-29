import { randomUUID } from "node:crypto";
import path from "node:path";
import { env } from "@/config/env.js";
import { logger } from "@/config/logger.js";
import type { StorageProvider, UploadOpts, UploadResult } from "../../types.js";
import { validateFile, mimeToExt } from "../../types.js";

export class SupabaseStorageProvider implements StorageProvider {
  readonly name = "supabase";
  private bucket: string;
  private baseUrl: string;
  private serviceKey: string;

  constructor() {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required for Supabase storage");
    }
    this.baseUrl = env.SUPABASE_URL;
    this.serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
    this.bucket = env.STORAGE_BUCKET ?? "uploads";
  }

  async upload(opts: UploadOpts): Promise<UploadResult> {
    validateFile(opts.buffer, opts.contentType);

    const ext = path.extname(opts.originalName) || mimeToExt(opts.contentType);
    const folder = opts.folder ?? "uploads";
    const key = `${folder}/${randomUUID()}${ext}`;

    const res = await fetch(
      `${this.baseUrl}/storage/v1/object/${this.bucket}/${key}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.serviceKey}`,
          "Content-Type": opts.contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
          "x-upsert": "false",
        },
        body: opts.buffer,
      },
    );

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Supabase storage upload failed (${res.status}): ${body}`);
    }

    const url = this.getPublicUrl(key);
    logger.info({ key, contentType: opts.contentType, size: opts.buffer.length }, "storage: uploaded (supabase)");

    return { key, url, contentType: opts.contentType, size: opts.buffer.length };
  }

  getPublicUrl(key: string): string {
    return `${this.baseUrl}/storage/v1/object/public/${this.bucket}/${key}`;
  }

  async delete(key: string): Promise<void> {
    const res = await fetch(
      `${this.baseUrl}/storage/v1/object/${this.bucket}/${key}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.serviceKey}`,
        },
      },
    );

    if (!res.ok && res.status !== 404) {
      const body = await res.text();
      throw new Error(`Supabase storage delete failed (${res.status}): ${body}`);
    }

    logger.info({ key }, "storage: deleted (supabase)");
  }
}
