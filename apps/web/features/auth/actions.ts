"use server";

import * as Sentry from "@sentry/nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isMockMode } from "@/lib/config/public";
import { serverConfig } from "@/lib/config/server";
import { getSession } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
import { apiPut, apiPost } from "@/lib/api/client-server";

const API_BASE = serverConfig.NEXT_PUBLIC_API_URL;

// ─── Token helpers ──────────────────────────────────────────────────

function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = cookies();
  cookieStore.set("access_token", accessToken, {
    httpOnly: false,
    secure: serverConfig.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60, // 1 hour
  });
  cookieStore.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: serverConfig.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

function clearAuthCookies() {
  const cookieStore = cookies();
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
}

// ─── Login ──────────────────────────────────────────────────────────

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export interface LoginActionState {
  ok: boolean;
  error?: string;
}

export async function loginAction(
  _prev: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: "invalid_input" };
  }

  if (isMockMode()) {
    // Simulate auth latency so the button's loading state is visible in mock
    // mode. No-op in production (mock mode is a local/prototype flag only).
    await new Promise((resolve) => setTimeout(resolve, 900));
    redirect("/app");
  }

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    const json = await res.json();

    if (!res.ok) {
      if (res.status === 401) return { ok: false, error: "invalid_credentials" };
      if (res.status === 403) return { ok: false, error: "email_not_verified" };
      return { ok: false, error: "login_failed" };
    }

    setAuthCookies(json.data.access_token ?? json.data.accessToken, json.data.refresh_token ?? json.data.refreshToken);
  } catch (err) {
    Sentry.captureException(err, { tags: { scope: "auth.login" } });
    logger.error("login failed", { error: err, scope: "auth.login" });
    return { ok: false, error: "login_failed" };
  }

  redirect("/app");
}

// ─── Signup ─────────────────────────────────────────────────────────

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  handle: z.string().min(2).max(30).optional(),
});

export interface SignupActionState {
  ok: boolean;
  done?: boolean;
  email?: string;
  error?: string;
}

export async function signupAction(
  _prev: SignupActionState,
  formData: FormData,
): Promise<SignupActionState> {
  // Public registration is invite-only for now (early access is the way in).
  // Defense-in-depth: the /signup UI is gated, this closes the action path too.
  if (process.env.NEXT_PUBLIC_REGISTRATION_OPEN !== "1") {
    return { ok: false, error: "registration_closed" };
  }

  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
    handle: formData.get("handle") || undefined,
  };
  const parsed = SignupSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues;
    const pwIssue = issues.find((i) => i.path[0] === "password");
    if (pwIssue) return { ok: false, error: "password_too_short" };
    return { ok: false, error: "invalid_input" };
  }

  if (isMockMode()) {
    return { ok: true, done: true, email: parsed.data.email };
  }

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    const json = await res.json();

    if (!res.ok) {
      if (res.status === 409) return { ok: false, error: "email_taken" };
      return { ok: false, error: "signup_failed" };
    }

    setAuthCookies(json.data.access_token ?? json.data.accessToken, json.data.refresh_token ?? json.data.refreshToken);
    return { ok: true, done: true, email: parsed.data.email };
  } catch (err) {
    Sentry.captureException(err, { tags: { scope: "auth.signup" } });
    logger.error("signup failed", { error: err, scope: "auth.signup" });
    return { ok: false, error: "signup_failed" };
  }
}

// ─── Verify email ───────────────────────────────────────────────────

export interface VerifyEmailState {
  ok: boolean;
  error?: string;
}

export async function verifyEmailAction(token: string): Promise<VerifyEmailState> {
  try {
    const res = await fetch(`${API_BASE}/auth/verify-email?token=${token}`);
    if (!res.ok) {
      return { ok: false, error: "invalid_or_expired" };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "verify_failed" };
  }
}

export async function resendVerificationAction(): Promise<{ ok: boolean; error?: string }> {
  try {
    await apiPost("/auth/resend-verification");
    return { ok: true };
  } catch {
    return { ok: false, error: "resend_failed" };
  }
}

// ─── Change password ────────────────────────────────────────────────

const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(128),
    confirmPassword: z.string().min(1),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "passwords_dont_match",
  });

export interface ChangePasswordState {
  ok: boolean;
  error?: string;
}

export async function changePasswordAction(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const user = await getSession();
  if (!user) return { ok: false, error: "unauthorized" };

  const parsed = ChangePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    if (issue?.message === "passwords_dont_match") {
      return { ok: false, error: "passwords_dont_match" };
    }
    if (issue?.path[0] === "newPassword") {
      return { ok: false, error: "password_too_short" };
    }
    return { ok: false, error: "invalid_input" };
  }

  if (isMockMode()) {
    await new Promise((resolve) => setTimeout(resolve, 700));
    return { ok: true };
  }

  try {
    await apiPost("/auth/change-password", {
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword,
    });
    return { ok: true };
  } catch (err) {
    // apiPost throws `API <status>: <path>`; 401 = wrong current password.
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("401")) return { ok: false, error: "wrong_password" };
    Sentry.captureException(err, {
      tags: { scope: "auth.changePassword" },
      extra: { userId: user.id },
    });
    logger.error("changePassword failed", { error: err, userId: user.id, scope: "auth.changePassword" });
    return { ok: false, error: "change_failed" };
  }
}

// ─── Trader profile ─────────────────────────────────────────────────

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

interface TraderProfileActionState {
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
  formData: FormData,
): Promise<TraderProfileActionState> {
  const user = await getSession();
  if (!user) {
    return { ok: false, error: "unauthorized" };
  }

  const rawMarkets = formData
    .getAll("markets")
    .filter((v): v is string => typeof v === "string")
    .filter((v): v is (typeof MARKET_VALUES)[number] =>
      (MARKET_VALUES as readonly string[]).includes(v),
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

  try {
    await apiPut("/users/profile", parsed.data);
    return { ok: true };
  } catch (err) {
    Sentry.captureException(err, {
      tags: { scope: "auth.saveTraderProfile" },
      extra: { userId: user.id },
    });
    logger.error("saveTraderProfile failed", {
      error: err,
      userId: user.id,
      scope: "auth.saveTraderProfile",
    });
    return { ok: false, error: "save_failed" };
  }
}

// ─── Logout ─────────────────────────────────────────────────────────

export async function logoutAction(): Promise<void> {
  try {
    await apiPost("/auth/logout");
  } catch {
    // Best-effort
  }
  clearAuthCookies();
  redirect("/");
}
