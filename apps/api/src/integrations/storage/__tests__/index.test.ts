import { describe, it, expect, vi, beforeEach } from "vitest";

const mockEnv = vi.hoisted(() => ({
  STORAGE_PROVIDER: undefined as string | undefined,
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-key",
  STORAGE_BUCKET: "uploads",
  AWS_S3_BUCKET: "test-bucket",
  AWS_S3_REGION: "us-east-1",
  AWS_ACCESS_KEY_ID: "AKIATEST",
  AWS_SECRET_ACCESS_KEY: "secret",
  AWS_S3_ENDPOINT: undefined as string | undefined,
}));

vi.mock("@/config/env.js", () => ({ env: mockEnv }));

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn().mockImplementation(() => ({ send: vi.fn() })),
  PutObjectCommand: vi.fn(),
  DeleteObjectCommand: vi.fn(),
}));

import { getStorageProvider } from "../index.js";

describe("getStorageProvider", () => {
  beforeEach(() => {
    mockEnv.STORAGE_PROVIDER = undefined;
  });

  it("returns null when STORAGE_PROVIDER is unset", () => {
    expect(getStorageProvider()).toBeNull();
  });

  it("returns SupabaseStorageProvider when set to supabase", () => {
    mockEnv.STORAGE_PROVIDER = "supabase";
    const provider = getStorageProvider();
    expect(provider).not.toBeNull();
    expect(provider!.name).toBe("supabase");
  });

  it("returns S3StorageProvider when set to s3", () => {
    mockEnv.STORAGE_PROVIDER = "s3";
    const provider = getStorageProvider();
    expect(provider).not.toBeNull();
    expect(provider!.name).toBe("s3");
  });
});
