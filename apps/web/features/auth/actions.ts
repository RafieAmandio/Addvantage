"use server";

import * as Sentry from "@sentry/nextjs";
import { headers } from "next/headers";
import { z } from "zod";
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
