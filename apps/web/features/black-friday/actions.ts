"use server";

import { apiPost } from "@/lib/api/client-server";
import {
  BlackFridayApplicationSchema,
  BlackFridayDraftSchema,
} from "@tradevantage/shared/schema";

type Fail = { ok: false; error: "invalid" | "uid_taken" | "reviewed" | "failed"; message?: string };

// A 409 from the API is either a taken UID or an application the desk already decided.
function toFail(err: unknown): Fail {
  const e = err as { status?: number; apiMessage?: string };
  if (e.status === 409) {
    return /BingX UID/i.test(e.apiMessage ?? "")
      ? { ok: false, error: "uid_taken", message: e.apiMessage }
      : { ok: false, error: "reviewed", message: e.apiMessage };
  }
  return { ok: false, error: "failed" };
}

// Identity step (and the BingX step, with the UID): keep a draft keyed by email, like apply.
export async function saveBlackFridayDraft(input: unknown): Promise<{ ok: true; status: string } | Fail> {
  const parsed = BlackFridayDraftSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  try {
    const data = await apiPost<{ status: string }>("/black-friday/draft", parsed.data);
    return { ok: true, status: data.status };
  } catch (err) {
    return toFail(err);
  }
}

// Re-validated server-side before it reaches the API.
export async function submitBlackFridayApplication(input: unknown): Promise<{ ok: true } | Fail> {
  const parsed = BlackFridayApplicationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  try {
    await apiPost("/black-friday", parsed.data);
    return { ok: true };
  } catch (err) {
    return toFail(err);
  }
}
