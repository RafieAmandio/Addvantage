"use server";

import * as Sentry from "@sentry/nextjs";
import type { TablesUpdate } from "@tradevantage/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/ratelimit";
import { supabaseServer } from "@/lib/supabase/server";

const EmailSchema = z.object({ email: z.string().email() });

export interface LoginActionState {
  ok: boolean;
  sent?: boolean;
  email?: string;
  error?: string;
}

export async function requestLoginOtp(
  _prev: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const parsed = EmailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { ok: false, error: "invalid_email" };
  }
  const email = parsed.data.email.toLowerCase();

  const ip =
    headers().get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await rateLimit({
    key: `auth:otp:${ip}`,
    limit: 5,
    windowSec: 60,
  });
  if (!rl.success) {
    return { ok: false, error: "rate_limited" };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabase = supabaseServer();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${siteUrl}/auth/callback` },
  });

  if (error) {
    Sentry.captureException(error, {
      tags: { scope: "auth.requestLoginOtp" },
      extra: { email },
    });
    logger.error("requestLoginOtp failed", {
      error,
      email,
      scope: "auth.requestLoginOtp",
    });
    return { ok: false, error: "send_failed" };
  }

  return { ok: true, sent: true, email };
}

const MARKET_VALUES = ["indo", "crypto", "forex", "us"] as const;
const TraderProfileSchema = z.object({
  handle: z
    .string()
    .trim()
    .min(2)
    .max(32)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
  tradingLength: z.enum(["<1", "1-3", "3-5", "5+"]).optional(),
  longestProfitable: z.enum(["1week", "1month", "1year", "3year+"]).optional(),
  markets: z.array(z.enum(MARKET_VALUES)).optional(),
  yearlyGoal: z.string().trim().max(500).optional(),
  faultAttribution: z.enum(["vantage", "me", "market"]).optional(),
});

export interface TraderProfileActionState {
  ok: boolean;
  error?: string;
}

function emptyToUndef(v: FormDataEntryValue | null): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length === 0 ? undefined : t;
}

export async function saveTraderProfile(
  _prev: TraderProfileActionState,
  formData: FormData
): Promise<TraderProfileActionState> {
  const user = await getSession();
  if (!user) {
    return { ok: false, error: "unauthorized" };
  }

  const rl = await rateLimit({
    key: `profile:save:${user.id}`,
    limit: 5,
    windowSec: 60,
  });
  if (!rl.success) {
    return { ok: false, error: "rate_limited" };
  }

  const rawMarkets = formData
    .getAll("markets")
    .filter((v): v is string => typeof v === "string")
    .filter((v): v is (typeof MARKET_VALUES)[number] =>
      (MARKET_VALUES as readonly string[]).includes(v)
    );

  const parsed = TraderProfileSchema.safeParse({
    handle: emptyToUndef(formData.get("handle")),
    tradingLength: emptyToUndef(formData.get("tradingLength")),
    longestProfitable: emptyToUndef(formData.get("longestProfitable")),
    markets: rawMarkets.length > 0 ? rawMarkets : undefined,
    yearlyGoal: emptyToUndef(formData.get("yearlyGoal")),
    faultAttribution: emptyToUndef(formData.get("faultAttribution")),
  });

  if (!parsed.success) {
    return { ok: false, error: "invalid_input" };
  }

  const data = parsed.data;
  const update: TablesUpdate<"profiles"> = {};
  if (data.handle !== undefined) update.handle = data.handle;
  if (data.tradingLength !== undefined) update.trading_length = data.tradingLength;
  if (data.longestProfitable !== undefined)
    update.longest_profitable = data.longestProfitable;
  if (data.markets !== undefined) update.markets = [...data.markets];
  if (data.yearlyGoal !== undefined) update.yearly_goal = data.yearlyGoal;
  if (data.faultAttribution !== undefined)
    update.fault_attribution = data.faultAttribution;

  if (Object.keys(update).length === 0) {
    return { ok: true };
  }

  const supabase = supabaseServer();
  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id);

  if (error) {
    Sentry.captureException(error, {
      tags: { scope: "auth.saveTraderProfile" },
      extra: { userId: user.id },
    });
    logger.error("saveTraderProfile failed", {
      error,
      userId: user.id,
      scope: "auth.saveTraderProfile",
    });
    return { ok: false, error: "save_failed" };
  }

  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  const supabase = supabaseServer();
  const { error } = await supabase.auth.signOut();
  if (error) {
    Sentry.captureException(error, { tags: { scope: "auth.logout" } });
    logger.error("logout failed", { error, scope: "auth.logout" });
    // Fall through — we still redirect so the session cookie at minimum
    // clears on the client side. If signOut fails server-side, the user
    // gets a stale client-side state but can retry from /login.
  }
  redirect("/");
}

export interface SignupActionState {
  ok: boolean;
  sent?: boolean;
  email?: string;
  error?: string;
}

export async function requestSignupOtp(
  _prev: SignupActionState,
  formData: FormData
): Promise<SignupActionState> {
  const parsed = EmailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { ok: false, error: "invalid_email" };
  }
  const email = parsed.data.email.toLowerCase();

  const ip =
    headers().get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await rateLimit({
    key: `auth:otp:${ip}`,
    limit: 5,
    windowSec: 60,
  });
  if (!rl.success) {
    return { ok: false, error: "rate_limited" };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabase = supabaseServer();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?next=/signup/liability`,
    },
  });

  if (error) {
    Sentry.captureException(error, {
      tags: { scope: "auth.requestSignupOtp" },
      extra: { email },
    });
    logger.error("requestSignupOtp failed", {
      error,
      email,
      scope: "auth.requestSignupOtp",
    });
    return { ok: false, error: "send_failed" };
  }

  return { ok: true, sent: true, email };
}
