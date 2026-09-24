import type { GiveawayEntryInput } from "@tradevantage/shared/schema";
import { giveawayRepository } from "./giveaway.repository.js";

export const giveawayService = {
  async submit(input: GiveawayEntryInput) {
    const entry = await giveawayRepository.upsert({
      bingxUid: input.bingxUid,
      contact: input.contact,
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
