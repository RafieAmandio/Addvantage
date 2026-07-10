export interface UploadOpts {
  buffer: Buffer;
  originalName: string;
  contentType: string;
  folder?: string;
  /** Override the default bucket (e.g. a private bucket for sensitive files). */
  bucket?: string;
  /** Default true. When false, the returned `url` is the object key (no public
   *  URL), for objects in a non-public bucket. */
  isPublic?: boolean;
}

export interface UploadResult {
  key: string;
  url: string;
  contentType: string;
  size: number;
}

export interface StorageProvider {
  name: string;
  upload(opts: UploadOpts): Promise<UploadResult>;
  getPublicUrl(key: string): string;
  delete(key: string): Promise<void>;
}

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export function validateFile(buffer: Buffer, contentType: string): void {
  if (!ALLOWED_MIME_TYPES.has(contentType)) {
    throw new Error(
      `Unsupported file type: ${contentType}. Allowed: ${[...ALLOWED_MIME_TYPES].join(", ")}`,
    );
  }
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(
      `File too large: ${buffer.length} bytes. Max: ${MAX_FILE_SIZE}`,
    );
  }
}

export function mimeToExt(mime: string): string {
  switch (mime) {
    case "image/jpeg": return ".jpg";
    case "image/png": return ".png";
    case "image/webp": return ".webp";
    case "image/gif": return ".gif";
    default: return "";
  }
}
