import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { env } from "@/config/env.js";
import { logger } from "@/config/logger.js";
import type { StorageProvider, UploadOpts, UploadResult } from "../../types.js";
import { validateFile, mimeToExt } from "../../types.js";

export class S3StorageProvider implements StorageProvider {
  readonly name = "s3";
  private client: S3Client;
  private bucket: string;
  private region: string;
  private endpoint: string | undefined;

  constructor() {
    if (!env.AWS_S3_BUCKET || !env.AWS_S3_REGION) {
      throw new Error("AWS_S3_BUCKET and AWS_S3_REGION required for S3 storage");
    }
    this.bucket = env.AWS_S3_BUCKET;
    this.region = env.AWS_S3_REGION;
    this.endpoint = env.AWS_S3_ENDPOINT;

    this.client = new S3Client({
      region: this.region,
      ...(this.endpoint && { endpoint: this.endpoint, forcePathStyle: true }),
      ...(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && {
        credentials: {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        },
      }),
    });
  }

  async upload(opts: UploadOpts): Promise<UploadResult> {
    validateFile(opts.buffer, opts.contentType);

    const ext = path.extname(opts.originalName) || mimeToExt(opts.contentType);
    const folder = opts.folder ?? "uploads";
    const key = `${folder}/${randomUUID()}${ext}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: opts.buffer,
        ContentType: opts.contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );

    const url = this.getPublicUrl(key);
    logger.info({ key, contentType: opts.contentType, size: opts.buffer.length }, "storage: uploaded (s3)");

    return { key, url, contentType: opts.contentType, size: opts.buffer.length };
  }

  getPublicUrl(key: string): string {
    if (this.endpoint) {
      return `${this.endpoint}/${this.bucket}/${key}`;
    }
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
    logger.info({ key }, "storage: deleted (s3)");
  }
}
