import { env } from "@/config/env.js";
import type { StorageProvider } from "./types.js";
import { SupabaseStorageProvider } from "./providers/supabase/provider.js";
import { S3StorageProvider } from "./providers/s3/provider.js";

export function getStorageProvider(): StorageProvider | null {
  const name = env.STORAGE_PROVIDER;
  if (!name) return null;
  switch (name) {
    case "supabase":
      return new SupabaseStorageProvider();
    case "s3":
      return new S3StorageProvider();
    default:
      return null;
  }
}

export type { StorageProvider, UploadOpts, UploadResult } from "./types.js";
