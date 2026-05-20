import { env } from "@/config/env.js";
import type { StorageProvider } from "./types.js";
import { SupabaseStorageProvider } from "./providers/supabase/provider.js";
import { S3StorageProvider } from "./providers/s3/provider.js";

let cached: StorageProvider | null | undefined;

export function getStorageProvider(): StorageProvider | null {
  if (cached !== undefined) return cached;
  const name = env.STORAGE_PROVIDER;
  if (!name) { cached = null; return null; }
  switch (name) {
    case "supabase":
      cached = new SupabaseStorageProvider();
      return cached;
    case "s3":
      cached = new S3StorageProvider();
      return cached;
    default:
      cached = null;
      return null;
  }
}

export type { StorageProvider, UploadOpts, UploadResult } from "./types.js";
