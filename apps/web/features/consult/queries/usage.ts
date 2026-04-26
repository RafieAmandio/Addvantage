import * as Sentry from "@sentry/nextjs";
import { logger } from "@/lib/logger";
import { supabaseServer } from "@/lib/supabase/server";

if (typeof window !== "undefined") {
  throw new Error("features/consult/queries/usage.ts is server-only");
}

export const FREE_DAILY_TOKEN_CAP = 10_000;

export async function getDailyTokensUsed(userId: string): Promise<number> {
  const supabase = supabaseServer();
  const { data, error } = await supabase.rpc("get_consult_daily_tokens_used");

  if (error) {
    Sentry.captureException(error, {
      tags: { scope: "consult.usage" },
      extra: { userId },
    });
    logger.error("getDailyTokensUsed failed", {
      error,
      userId,
      scope: "consult.usage",
    });
    return 0;
  }

  const raw = typeof data === "number" ? data : Number(data);
  return Number.isFinite(raw) && raw >= 0 ? raw : 0;
}
