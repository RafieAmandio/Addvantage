import { describe, it, expect } from "vitest";
import { validateFile, mimeToExt } from "../types.js";

describe("validateFile", () => {
  const small = Buffer.alloc(100);
  const fiveMB = Buffer.alloc(5 * 1024 * 1024);
  const overLimit = Buffer.alloc(5 * 1024 * 1024 + 1);

  it("accepts image/jpeg", () => {
    expect(() => validateFile(small, "image/jpeg")).not.toThrow();
  });

  it("accepts image/png", () => {
    expect(() => validateFile(small, "image/png")).not.toThrow();
  });

  it("accepts image/webp", () => {
    expect(() => validateFile(small, "image/webp")).not.toThrow();
  });

  it("accepts image/gif", () => {
    expect(() => validateFile(small, "image/gif")).not.toThrow();
  });

  it("rejects unsupported mime type", () => {
    expect(() => validateFile(small, "application/pdf")).toThrow(
      "Unsupported file type: application/pdf",
    );
  });

  it("rejects text/plain", () => {
    expect(() => validateFile(small, "text/plain")).toThrow("Unsupported file type");
  });

  it("accepts file exactly at 5 MB", () => {
    expect(() => validateFile(fiveMB, "image/png")).not.toThrow();
  });

  it("rejects file over 5 MB", () => {
    expect(() => validateFile(overLimit, "image/png")).toThrow("File too large");
  });
});

describe("mimeToExt", () => {
  it("maps image/jpeg to .jpg", () => {
    expect(mimeToExt("image/jpeg")).toBe(".jpg");
  });

  it("maps image/png to .png", () => {
    expect(mimeToExt("image/png")).toBe(".png");
  });

  it("maps image/webp to .webp", () => {
    expect(mimeToExt("image/webp")).toBe(".webp");
  });

  it("maps image/gif to .gif", () => {
    expect(mimeToExt("image/gif")).toBe(".gif");
  });

  it("returns empty string for unknown mime", () => {
    expect(mimeToExt("application/octet-stream")).toBe("");
  });
});
