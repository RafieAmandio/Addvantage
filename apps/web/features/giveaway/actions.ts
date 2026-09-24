"use server";

import { apiPost } from "@/lib/api/client-server";
import { isMockMode } from "@/lib/config/public";
import { GiveawayEntrySchema } from "@tradevantage/shared/schema";

export interface GiveawayState {
  ok: boolean;
  error?: string;
}

export async function submitGiveawayEntry(
  _prev: GiveawayState,
  formData: FormData,
): Promise<GiveawayState> {
  const parsed = GiveawayEntrySchema.safeParse({
    bingxUid: formData.get("bingxUid"),
    email: formData.get("email"),
    telegram: formData.get("telegram"),
    name: formData.get("name") ?? "",
    website: formData.get("website") ?? "", // honeypot
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the fields and try again." };
  }

  if (isMockMode()) {
    await new Promise((r) => setTimeout(r, 600));
    return { ok: true };
  }

  try {
    await apiPost("/giveaway", parsed.data);
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("429")) {
      return { ok: false, error: "Too many attempts. Please wait a moment and try again." };
    }
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
