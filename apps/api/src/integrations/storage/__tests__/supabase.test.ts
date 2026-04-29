import { describe, it, expect, vi, beforeEach } from "vitest";

const mockEnv = vi.hoisted(() => ({
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-key",
  STORAGE_BUCKET: "my-bucket",
}));

vi.mock("@/config/env.js", () => ({ env: mockEnv }));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { SupabaseStorageProvider } from "../providers/supabase/provider.js";

describe("SupabaseStorageProvider", () => {
  let provider: SupabaseStorageProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv.SUPABASE_URL = "https://test.supabase.co";
    mockEnv.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
    mockEnv.STORAGE_BUCKET = "my-bucket";
    provider = new SupabaseStorageProvider();
  });

  it("has name supabase", () => {
    expect(provider.name).toBe("supabase");
  });

  it("throws if SUPABASE_URL is missing", () => {
    mockEnv.SUPABASE_URL = undefined as unknown as string;
    expect(() => new SupabaseStorageProvider()).toThrow(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required",
    );
  });

  it("throws if SUPABASE_SERVICE_ROLE_KEY is missing", () => {
    mockEnv.SUPABASE_SERVICE_ROLE_KEY = undefined as unknown as string;
    expect(() => new SupabaseStorageProvider()).toThrow(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required",
    );
  });

  it("defaults bucket to uploads when STORAGE_BUCKET is unset", () => {
    mockEnv.STORAGE_BUCKET = undefined as unknown as string;
    const p = new SupabaseStorageProvider();
    expect(p.getPublicUrl("test/file.jpg")).toContain("/uploads/");
  });

  describe("getPublicUrl", () => {
    it("returns the public URL for a key", () => {
      expect(provider.getPublicUrl("consult/abc.jpg")).toBe(
        "https://test.supabase.co/storage/v1/object/public/my-bucket/consult/abc.jpg",
      );
    });
  });

  describe("upload", () => {
    const opts = {
      buffer: Buffer.from("fake-image-data"),
      originalName: "photo.jpg",
      contentType: "image/jpeg",
      folder: "consult",
    };

    it("uploads successfully", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      const result = await provider.upload(opts);

      expect(result.contentType).toBe("image/jpeg");
      expect(result.size).toBe(opts.buffer.length);
      expect(result.key).toMatch(/^consult\/[a-f0-9-]+\.jpg$/);
      expect(result.url).toContain("storage/v1/object/public/my-bucket/consult/");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("storage/v1/object/my-bucket/consult/"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-service-key",
            "Content-Type": "image/jpeg",
          }),
        }),
      );
    });

    it("uses mimeToExt fallback when originalName has no extension", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      const result = await provider.upload({ ...opts, originalName: "photo" });
      expect(result.key).toMatch(/\.jpg$/);
    });

    it("defaults folder to uploads", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      const result = await provider.upload({ ...opts, folder: undefined });
      expect(result.key).toMatch(/^uploads\//);
    });

    it("throws on upload failure", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => "Forbidden",
      });

      await expect(provider.upload(opts)).rejects.toThrow(
        "Supabase storage upload failed (403): Forbidden",
      );
    });

    it("rejects unsupported mime type", async () => {
      await expect(
        provider.upload({ ...opts, contentType: "application/pdf" }),
      ).rejects.toThrow("Unsupported file type");
    });

    it("rejects oversized file", async () => {
      await expect(
        provider.upload({ ...opts, buffer: Buffer.alloc(6 * 1024 * 1024) }),
      ).rejects.toThrow("File too large");
    });
  });

  describe("delete", () => {
    it("deletes successfully", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      await expect(provider.delete("consult/abc.jpg")).resolves.not.toThrow();

      expect(mockFetch).toHaveBeenCalledWith(
        "https://test.supabase.co/storage/v1/object/my-bucket/consult/abc.jpg",
        expect.objectContaining({
          method: "DELETE",
          headers: { Authorization: "Bearer test-service-key" },
        }),
      );
    });

    it("ignores 404 on delete", async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 404 });

      await expect(provider.delete("consult/gone.jpg")).resolves.not.toThrow();
    });

    it("throws on non-404 failure", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "Internal Server Error",
      });

      await expect(provider.delete("consult/abc.jpg")).rejects.toThrow(
        "Supabase storage delete failed (500)",
      );
    });
  });
});
