"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { apiPost } from "@/lib/api/client-server";

const UserPinSchema = z.object({
  title: z.string().trim().min(1, "title required").max(200),
  body: z.string().trim().max(2000).optional(),
  symbol: z.string().trim().min(1).max(20),
  occurredAt: z.string().datetime({ message: "invalid occurredAt" }),
});

export interface PinActionState {
  ok: boolean;
  error?: string;
}

export async function createUserPin(
  _prev: PinActionState,
  formData: FormData,
): Promise<PinActionState> {
  const user = await getSession();
  if (!user) return { ok: false, error: "unauthorized" };

  const bodyRaw = formData.get("body");
  const parsed = UserPinSchema.safeParse({
    title: formData.get("title"),
    body: bodyRaw && String(bodyRaw).length > 0 ? bodyRaw : undefined,
    symbol: formData.get("symbol"),
    occurredAt: formData.get("occurredAt"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "invalid",
    };
  }

  const { title, body, symbol, occurredAt } = parsed.data;
  const upperSymbol = symbol.toUpperCase();

  try {
    await apiPost("/timeline/pin", {
      title,
      body: body ?? null,
      symbol: upperSymbol,
      occurredAt,
    });
    revalidatePath(`/app/chart/${upperSymbol}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "insert_failed" };
  }
}
