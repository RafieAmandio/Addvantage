"use server";

import { apiPost } from "@/lib/api/client-server";
import { isMockMode } from "@/lib/config/public";
import {
  EarlyAccessApplicationSchema,
  EarlyAccessLeadSchema,
} from "@tradevantage/shared/schema";

interface DraftApplication {
  wantsCashback: boolean | null;
  broker: string | null;
  brokerAccountRef: string | null;
  signedName: string | null;
  acknowledgements: Record<string, boolean> | null;
  paymentMethod: string | null;
  proofImageUrl: string | null;
}

// Identity step: persist the lead (email + telegram) so the team has a
// follow-up record even if the flow is abandoned. Returns the current draft so
// a returning visitor's progress can be restored.
export async function startEarlyAccessLead(input: unknown): Promise<{
  ok: boolean;
  status?: string;
  application?: DraftApplication | null;
}> {
  const parsed = EarlyAccessLeadSchema.safeParse(input);
  if (!parsed.success) return { ok: false };

  if (isMockMode()) return { ok: true, status: "draft", application: null };

  try {
    const data = await apiPost<{ status: string; application: DraftApplication }>(
      "/early-access/lead",
      parsed.data,
    );
    return { ok: true, status: data.status, application: data.application };
  } catch {
    return { ok: false };
  }
}

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
