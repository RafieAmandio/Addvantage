import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.fn();

const mockEnv = vi.hoisted(() => ({
  AWS_S3_BUCKET: "test-bucket",
  AWS_S3_REGION: "us-east-1",
  AWS_ACCESS_KEY_ID: "AKIATEST",
  AWS_SECRET_ACCESS_KEY: "secret",
  AWS_S3_ENDPOINT: undefined as string | undefined,
  STORAGE_BUCKET: undefined as string | undefined,
}));

vi.mock("@/config/env.js", () => ({ env: mockEnv }));

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn().mockImplementation(() => ({ send: mockSend })),
  PutObjectCommand: vi.fn().mockImplementation((input) => ({ _input: input })),
  DeleteObjectCommand: vi.fn().mockImplementation((input) => ({ _input: input })),
}));

import { S3StorageProvider } from "../providers/s3/provider.js";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

describe("S3StorageProvider", () => {
  let provider: S3StorageProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv.AWS_S3_BUCKET = "test-bucket";
    mockEnv.AWS_S3_REGION = "us-east-1";
    mockEnv.AWS_S3_ENDPOINT = undefined;
    provider = new S3StorageProvider();
  });

  it("has name s3", () => {
    expect(provider.name).toBe("s3");
  });

  it("throws if AWS_S3_BUCKET is missing", () => {
    mockEnv.AWS_S3_BUCKET = undefined as unknown as string;
    expect(() => new S3StorageProvider()).toThrow(
      "AWS_S3_BUCKET and AWS_S3_REGION required",
    );
  });

  it("throws if AWS_S3_REGION is missing", () => {
    mockEnv.AWS_S3_REGION = undefined as unknown as string;
    expect(() => new S3StorageProvider()).toThrow(
      "AWS_S3_BUCKET and AWS_S3_REGION required",
    );
  });

  describe("getPublicUrl", () => {
    it("returns standard S3 URL", () => {
      expect(provider.getPublicUrl("consult/abc.jpg")).toBe(
        "https://test-bucket.s3.us-east-1.amazonaws.com/consult/abc.jpg",
      );
    });

    it("returns custom endpoint URL when AWS_S3_ENDPOINT is set", () => {
      mockEnv.AWS_S3_ENDPOINT = "https://r2.example.com";
      const p = new S3StorageProvider();
      expect(p.getPublicUrl("consult/abc.jpg")).toBe(
        "https://r2.example.com/test-bucket/consult/abc.jpg",
      );
    });
  });

  describe("upload", () => {
    const opts = {
      buffer: Buffer.from("fake-image-data"),
      originalName: "photo.png",
      contentType: "image/png",
      folder: "consult",
    };

    it("uploads with PutObjectCommand", async () => {
      mockSend.mockResolvedValue({});

      const result = await provider.upload(opts);

      expect(result.contentType).toBe("image/png");
      expect(result.size).toBe(opts.buffer.length);
      expect(result.key).toMatch(/^consult\/[a-f0-9-]+\.png$/);
      expect(result.url).toContain("test-bucket.s3.us-east-1.amazonaws.com/consult/");

      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: "test-bucket",
          ContentType: "image/png",
          CacheControl: "public, max-age=31536000, immutable",
        }),
      );
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it("defaults folder to uploads", async () => {
      mockSend.mockResolvedValue({});
      const result = await provider.upload({ ...opts, folder: undefined });
      expect(result.key).toMatch(/^uploads\//);
    });

    it("uses mimeToExt when originalName has no extension", async () => {
      mockSend.mockResolvedValue({});
      const result = await provider.upload({ ...opts, originalName: "photo" });
      expect(result.key).toMatch(/\.png$/);
    });

    it("throws on S3 send failure", async () => {
      mockSend.mockRejectedValue(new Error("AccessDenied"));
      await expect(provider.upload(opts)).rejects.toThrow("AccessDenied");
    });

    it("rejects unsupported mime type", async () => {
      await expect(
        provider.upload({ ...opts, contentType: "video/mp4" }),
      ).rejects.toThrow("Unsupported file type");
    });

    it("rejects oversized file", async () => {
      await expect(
        provider.upload({ ...opts, buffer: Buffer.alloc(6 * 1024 * 1024) }),
      ).rejects.toThrow("File too large");
    });
  });

  describe("delete", () => {
    it("deletes with DeleteObjectCommand", async () => {
      mockSend.mockResolvedValue({});

      await provider.delete("consult/abc.jpg");

      expect(DeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: "test-bucket",
        Key: "consult/abc.jpg",
      });
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it("throws on S3 send failure", async () => {
      mockSend.mockRejectedValue(new Error("InternalError"));
      await expect(provider.delete("consult/abc.jpg")).rejects.toThrow("InternalError");
    });
  });
});
