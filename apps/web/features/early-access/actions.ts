"use server";

import { apiPost } from "@/lib/api/client-server";
import { isMockMode } from "@/lib/config/public";
import { EarlyAccessApplicationSchema } from "@tradevantage/shared/schema";

// Invoked directly from the client wizard with the assembled payload.
// Re-validates server-side (defense in depth) before hitting the API.
export async function submitEarlyAccessApplication(
  input: unknown,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = EarlyAccessApplicationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid" };
  }

  if (isMockMode()) {
    return { ok: true };
  }

  try {
    await apiPost("/early-access", parsed.data);
    return { ok: true };
  } catch {
    return { ok: false, error: "submit_failed" };
  }
}
