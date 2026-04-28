import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundError } from "@/core/errors/index.js";

vi.mock("./education.repository.js", () => ({
  educationRepository: {
    listPublished: vi.fn(),
    findById: vi.fn(),
    findBySlug: vi.fn(),
  },
}));

import { educationService } from "./education.service.js";
import { educationRepository } from "./education.repository.js";

const repo = vi.mocked(educationRepository);

const mockPrimer = (overrides: Partial<{
  slug: string;
  published: boolean;
}> = {}) => ({
  slug: overrides.slug ?? "intro-to-forex",
  title: "Introduction to Forex",
  author: "admin",
  framework: "technical",
  summary: "A primer on forex trading",
  tags: ["forex", "basics"],
  readingMin: 5,
  locked: false,
  body: "Full body content here...",
  published: overrides.published ?? true,
});

const mockListItem = () => ({
  slug: "intro-to-forex",
  title: "Introduction to Forex",
  author: "admin",
  framework: "technical",
  summary: "A primer on forex trading",
  tags: ["forex", "basics"],
  readingMin: 5,
  locked: false,
});

describe("educationService", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe("listPublished", () => {
    it("uses default limit of 100", async () => {
      repo.listPublished.mockResolvedValue([] as never);

      await educationService.listPublished();

      expect(repo.listPublished).toHaveBeenCalledWith(100);
    });

    it("passes custom limit", async () => {
      repo.listPublished.mockResolvedValue([] as never);

      await educationService.listPublished(25);

      expect(repo.listPublished).toHaveBeenCalledWith(25);
    });
  });

  describe("getByIdOrSlug", () => {
    it("fetches by UUID when given valid UUID", async () => {
      const primer = mockPrimer();
      repo.findById.mockResolvedValue(primer as never);

      const uuid = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
      await educationService.getByIdOrSlug(uuid);

      expect(repo.findById).toHaveBeenCalledWith(uuid);
      expect(repo.findBySlug).not.toHaveBeenCalled();
    });

    it("fetches by slug when given non-UUID string", async () => {
      const primer = mockPrimer();
      repo.findBySlug.mockResolvedValue(primer as never);

      await educationService.getByIdOrSlug("intro-to-forex");

      expect(repo.findBySlug).toHaveBeenCalledWith("intro-to-forex");
      expect(repo.findById).not.toHaveBeenCalled();
    });

    it("throws NotFoundError when not found", async () => {
      repo.findBySlug.mockResolvedValue(null as never);

      await expect(
        educationService.getByIdOrSlug("nonexistent-slug"),
      ).rejects.toThrow(NotFoundError);
    });

    it("throws NotFoundError when not published", async () => {
      const primer = mockPrimer({ published: false });
      repo.findBySlug.mockResolvedValue(primer as never);

      await expect(
        educationService.getByIdOrSlug("draft-primer"),
      ).rejects.toThrow(NotFoundError);
    });

    it("strips published field from result", async () => {
      const primer = mockPrimer({ published: true });
      repo.findBySlug.mockResolvedValue(primer as never);

      const result = await educationService.getByIdOrSlug("intro-to-forex");

      expect(result).not.toHaveProperty("published");
      expect(result).toHaveProperty("slug", "intro-to-forex");
      expect(result).toHaveProperty("title", "Introduction to Forex");
      expect(result).toHaveProperty("body", "Full body content here...");
    });
  });
});
