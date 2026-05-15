import { NotFoundError } from "@/core/errors/index.js";
import { userRepository } from "./user.repository.js";

export const userService = {
  async getMe(userId: string) {
    const profile = await userRepository.findMe(userId);
    if (!profile) throw new NotFoundError("Profile not found");
    return profile;
  },

  async listAll() {
    return userRepository.findAll();
  },

  async updateProfile(
    userId: string,
    data: {
      handle?: string;
      tradingLength?: string;
      longestProfitable?: string;
      markets?: string[];
      yearlyGoal?: string;
      faultAttribution?: string;
    },
  ) {
    const profile = await userRepository.findById(userId);
    if (!profile) throw new NotFoundError("Profile not found");

    if (Object.keys(data).length === 0) return;

    await userRepository.updateProfile(userId, data);
  },
};
