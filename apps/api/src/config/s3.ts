import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { env } from "./env.js";
import { logger } from "./logger.js";

let _client: S3Client | null = null;

function getClient(): S3Client | null {
  if (_client) return _client;
  if (!env.AWS_S3_BUCKET || !env.AWS_S3_REGION) return null;

  _client = new S3Client({
    region: env.AWS_S3_REGION,
    ...(env.AWS_S3_ENDPOINT && { endpoint: env.AWS_S3_ENDPOINT, forcePathStyle: true }),
    ...(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && {
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    }),
  });
  return _client;
}

export function isS3Configured(): boolean {
  return Boolean(env.AWS_S3_BUCKET && env.AWS_S3_REGION);
}

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export interface UploadResult {
  key: string;
  url: string;
  contentType: string;
  size: number;
}

export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  contentType: string,
  folder: string = "uploads",
): Promise<UploadResult> {
  const client = getClient();
  if (!client || !env.AWS_S3_BUCKET) {
    throw new Error("S3 not configured");
  }

  if (!ALLOWED_MIME_TYPES.has(contentType)) {
    throw new Error(`Unsupported file type: ${contentType}. Allowed: ${[...ALLOWED_MIME_TYPES].join(", ")}`);
  }

  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(`File too large: ${buffer.length} bytes. Max: ${MAX_FILE_SIZE}`);
  }

  const ext = path.extname(originalName) || mimeToExt(contentType);
  const key = `${folder}/${randomUUID()}${ext}`;

  await client.send(
    new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  const url = env.AWS_S3_ENDPOINT
    ? `${env.AWS_S3_ENDPOINT}/${env.AWS_S3_BUCKET}/${key}`
    : `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_S3_REGION}.amazonaws.com/${key}`;

  logger.info({ key, contentType, size: buffer.length }, "s3: uploaded");

  return { key, url, contentType, size: buffer.length };
}

export async function deleteFile(key: string): Promise<void> {
  const client = getClient();
  if (!client || !env.AWS_S3_BUCKET) return;

  await client.send(
    new DeleteObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
    }),
  );

  logger.info({ key }, "s3: deleted");
}

export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const client = getClient();
  if (!client || !env.AWS_S3_BUCKET) {
    throw new Error("S3 not configured");
  }

  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: env.AWS_S3_BUCKET, Key: key }),
    { expiresIn },
  );
}

function mimeToExt(mime: string): string {
  switch (mime) {
    case "image/jpeg": return ".jpg";
    case "image/png": return ".png";
    case "image/webp": return ".webp";
    case "image/gif": return ".gif";
    default: return "";
  }
}
