import { NotFoundError } from "@/core/errors/index.js";
import { educationRepository } from "./education.repository.js";

const DEFAULT_LIMIT = 100;

export const educationService = {
  async listPublished(limit?: number) {
    return educationRepository.listPublished(limit ?? DEFAULT_LIMIT);
  },

  async getByIdOrSlug(idOrSlug: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    const primer = isUuid
      ? await educationRepository.findById(idOrSlug)
      : await educationRepository.findBySlug(idOrSlug);

    if (!primer) throw new NotFoundError("Primer not found");
    if (!primer.published) throw new NotFoundError("Primer not found");

    const { published: _, ...rest } = primer;
    return rest;
  },
};
