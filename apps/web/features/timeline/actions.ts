"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { supabaseServer } from "@/lib/supabase/server";
import { enforceUserRateLimit } from "@/lib/user-ratelimit";

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
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const ip =
    headers().get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  try {
    await enforceUserRateLimit(user.id, "timeline:pin", {
      limit: 10,
      windowSec: 60,
      scope: "timeline.createUserPin",
      keySuffix: ip,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "rate_limited") {
      return { ok: false, error: "rate_limited" };
    }
    throw err;
  }

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

  const { error } = await supabase.from("timeline_events").insert({
    kind: "user_pin",
    source_code: "USER",
    occurred_at: occurredAt,
    symbols: [upperSymbol],
    title,
    body: body ?? null,
    created_by: user.id,
  });

  if (error) {
    Sentry.captureException(error, {
      tags: { scope: "timeline.createUserPin" },
      extra: { userId: user.id, symbol: upperSymbol },
    });
    logger.error("createUserPin failed", {
      error,
      userId: user.id,
      symbol: upperSymbol,
      scope: "timeline.createUserPin",
    });
    return { ok: false, error: "insert_failed" };
  }

  revalidatePath(`/app/chart/${upperSymbol}`);
  return { ok: true };
}
