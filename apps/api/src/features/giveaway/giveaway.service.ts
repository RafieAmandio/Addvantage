import type { GiveawayEntryInput } from "@tradevantage/shared/schema";
import { giveawayRepository } from "./giveaway.repository.js";

export const giveawayService = {
  async submit(input: GiveawayEntryInput) {
    const entry = await giveawayRepository.upsert({
      bingxUid: input.bingxUid,
      email: input.email,
      telegram: input.telegram,
      ...(input.name ? { name: input.name } : {}),
    });
    return { id: entry.id };
  },

  async list() {
    const [entries, total] = await Promise.all([
      giveawayRepository.list(),
      giveawayRepository.count(),
    ]);
    return { entries, total };
  },

  async draw() {
    return giveawayRepository.drawRandom();
  },
};
