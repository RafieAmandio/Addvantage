"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/session";
import { enforceAdminRateLimit } from "@/lib/admin-ratelimit";
import { logger } from "@/lib/logger";
import type { Json, TablesInsert, TablesUpdate } from "@tradevantage/db";
import {
  PlanDirectionSchema,
  PlanOutcomeSchema,
  PlanSetupSchema,
  PlanTierSchema,
} from "@/features/plan/types";

const ADMIN_SCOPE = "admin.plan";

export interface PlanActionState {
  ok: boolean;
  error?: string;
  id?: string;
}

// --- input schemas --------------------------------------------------------

const nullableNumber = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((v) => {
    if (v === null || v === undefined) return null;
    if (typeof v === "number") return Number.isFinite(v) ? v : null;
    const s = v.trim();
    if (s === "") return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  });

const csvArray = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => {
    if (!v) return [] as string[];
    return String(v)
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  });

const setupsField = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v, ctx) => {
    if (!v) return [] as z.infer<typeof PlanSetupSchema>[];
    const text = String(v).trim();
    if (text === "") return [] as z.infer<typeof PlanSetupSchema>[];
    try {
      const raw = JSON.parse(text);
      const parsed = z.array(PlanSetupSchema).safeParse(raw);
      if (!parsed.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "setups must be a JSON array of {label, trigger?, invalidation?, note?}",
        });
        return z.NEVER;
      }
      return parsed.data;
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "setups is not valid JSON",
      });
      return z.NEVER;
    }
  });

export const PlanCreateInputSchema = z.object({
  symbol: z.string().min(1).max(32),
  thesis: z.string().min(1),
  direction: PlanDirectionSchema,
  entry: nullableNumber,
  stop: nullableNumber,
  target: nullableNumber,
  r_multiple: nullableNumber,
  setups: setupsField,
  tags: csvArray,
  tier: PlanTierSchema,
});

export const PlanUpdateInputSchema = PlanCreateInputSchema.partial();

export const PlanCloseInputSchema = z.object({
  outcome: PlanOutcomeSchema,
  close_price: nullableNumber,
});

/**
 * Compute realized-R from entry/stop risk geometry. Returns null whenever the
 * inputs are incomplete or the risk leg is degenerate (`entry === stop` would
 * divide by zero). Longs: profit relative to the one-R risk leg below entry;
 * shorts: profit relative to the one-R risk leg above entry. Rounded to 2dp
 * so the DB doesn't store noisy floating-point tails.
 */
function computeRealizedR(input: {
  direction: "long" | "short";
  entry: number | null;
  stop: number | null;
  close_price: number | null;
}): number | null {
  const { direction, entry, stop, close_price } = input;
  if (entry === null || stop === null || close_price === null) return null;
  if (entry === stop) return null;
  const raw =
    direction === "long"
      ? (close_price - entry) / (entry - stop)
      : (entry - close_price) / (stop - entry);
  if (!Number.isFinite(raw)) return null;
  return Math.round(raw * 100) / 100;
}

// --- form helpers ---------------------------------------------------------

function readPlanForm(fd: FormData) {
  return {
    symbol: fd.get("symbol"),
    thesis: fd.get("thesis"),
    direction: fd.get("direction"),
    entry: fd.get("entry"),
    stop: fd.get("stop"),
    target: fd.get("target"),
    r_multiple: fd.get("r_multiple"),
    setups: fd.get("setups"),
    tags: fd.get("tags"),
    tier: fd.get("tier"),
  };
}

// --- actions --------------------------------------------------------------

export async function createPlan(
  _prev: PlanActionState,
  formData: FormData,
): Promise<PlanActionState> {
  const admin = await requireAdmin();
  try {
    await enforceAdminRateLimit(admin.id, "createPlan", ADMIN_SCOPE);
  } catch {
    return { ok: false, error: "rate_limited" };
  }

  const parse = PlanCreateInputSchema.safeParse(readPlanForm(formData));
  if (!parse.success) {
    return {
      ok: false,
      error: parse.error.issues[0]?.message ?? "validation failed",
    };
  }

  const now = new Date().toISOString();
  const insert: TablesInsert<"trading_plans"> = {
    symbol: parse.data.symbol,
    thesis: parse.data.thesis,
    direction: parse.data.direction,
    entry: parse.data.entry,
    stop: parse.data.stop,
    target: parse.data.target,
    r_multiple: parse.data.r_multiple,
    setups: JSON.parse(JSON.stringify(parse.data.setups)) as Json,
    tags: parse.data.tags,
    tier: parse.data.tier,
    status: "draft",
    author_id: admin.id,
    created_at: now,
    updated_at: now,
  };

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("trading_plans")
    .insert(insert)
    .select("id")
    .single();

  if (error || !data) {
    Sentry.captureException(error ?? new Error("createPlan: no row returned"), {
      tags: { scope: "admin.plan.create" },
    });
    logger.error("createPlan failed", { error, scope: "admin.plan.create" });
    return { ok: false, error: error?.message ?? "insert failed" };
  }

  revalidatePath("/admin/plans");
  redirect(`/admin/plans/${data.id}`);
}

export async function updatePlan(
  id: string,
  _prev: PlanActionState,
  formData: FormData,
): Promise<PlanActionState> {
  const admin = await requireAdmin();
  try {
    await enforceAdminRateLimit(admin.id, "updatePlan", ADMIN_SCOPE);
  } catch {
    return { ok: false, error: "rate_limited" };
  }

  const parse = PlanUpdateInputSchema.safeParse(readPlanForm(formData));
  if (!parse.success) {
    return {
      ok: false,
      error: parse.error.issues[0]?.message ?? "validation failed",
    };
  }

  const { setups, ...rest } = parse.data;
  const update: TablesUpdate<"trading_plans"> = {
    ...rest,
    updated_at: new Date().toISOString(),
  };
  if (setups !== undefined) {
    update.setups = JSON.parse(JSON.stringify(setups)) as Json;
  }

  const supabase = supabaseServer();
  const { error } = await supabase
    .from("trading_plans")
    .update(update)
    .eq("id", id);

  if (error) {
    Sentry.captureException(error, {
      tags: { scope: "admin.plan.update" },
      extra: { id },
    });
    logger.error("updatePlan failed", {
      id,
      error,
      scope: "admin.plan.update",
    });
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/plans");
  revalidatePath(`/admin/plans/${id}`);
  return { ok: true, id };
}

export async function publishPlan(id: string): Promise<void> {
  const admin = await requireAdmin();
  await enforceAdminRateLimit(admin.id, "publishPlan", ADMIN_SCOPE);

  const now = new Date().toISOString();
  const update: TablesUpdate<"trading_plans"> = {
    status: "published",
    published_at: now,
    updated_at: now,
  };

  const supabase = supabaseServer();
  const { error } = await supabase
    .from("trading_plans")
    .update(update)
    .eq("id", id);

  if (error) {
    Sentry.captureException(error, {
      tags: { scope: "admin.plan.publish" },
      extra: { id },
    });
    logger.error("publishPlan failed", {
      id,
      error,
      scope: "admin.plan.publish",
    });
    throw new Error(error.message);
  }

  revalidatePath("/admin/plans");
  revalidatePath(`/admin/plans/${id}`);
  revalidatePath("/app/plans");
}

export async function closePlan(id: string, formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  await enforceAdminRateLimit(admin.id, "closePlan", ADMIN_SCOPE);

  const parse = PlanCloseInputSchema.safeParse({
    outcome: formData.get("outcome"),
    close_price: formData.get("close_price"),
  });
  if (!parse.success) {
    throw new Error(parse.error.issues[0]?.message ?? "validation failed");
  }

  const supabase = supabaseServer();

  // Load entry/stop/direction so we can derive realized_r server-side. We
  // never trust the client to send these — the row is the source of truth.
  const { data: row, error: fetchError } = await supabase
    .from("trading_plans")
    .select("direction, entry, stop")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !row) {
    const err = fetchError ?? new Error("closePlan: plan not found");
    Sentry.captureException(err, {
      tags: { scope: "admin.plan.close" },
      extra: { id },
    });
    logger.error("closePlan fetch failed", {
      id,
      error: err,
      scope: "admin.plan.close",
    });
    throw new Error(fetchError?.message ?? "plan not found");
  }

  const realized_r = computeRealizedR({
    direction: row.direction as "long" | "short",
    entry: row.entry,
    stop: row.stop,
    close_price: parse.data.close_price,
  });

  const now = new Date().toISOString();
  const update: TablesUpdate<"trading_plans"> = {
    status: "closed",
    outcome: parse.data.outcome,
    close_price: parse.data.close_price,
    realized_r,
    closed_at: now,
    updated_at: now,
  };

  const { error } = await supabase
    .from("trading_plans")
    .update(update)
    .eq("id", id);

  if (error) {
    Sentry.captureException(error, {
      tags: { scope: "admin.plan.close" },
      extra: { id },
    });
    logger.error("closePlan failed", {
      id,
      error,
      scope: "admin.plan.close",
    });
    throw new Error(error.message);
  }

  revalidatePath("/admin/plans");
  revalidatePath(`/admin/plans/${id}`);
  revalidatePath("/app/plan");
  revalidatePath(`/app/plan/${id}`);
}

export async function deletePlan(id: string): Promise<void> {
  const admin = await requireAdmin();
  await enforceAdminRateLimit(admin.id, "deletePlan", ADMIN_SCOPE);

  const supabase = supabaseServer();
  const { error } = await supabase.from("trading_plans").delete().eq("id", id);

  if (error) {
    Sentry.captureException(error, {
      tags: { scope: "admin.plan.delete" },
      extra: { id },
    });
    logger.error("deletePlan failed", {
      id,
      error,
      scope: "admin.plan.delete",
    });
    throw new Error(error.message);
  }

  revalidatePath("/admin/plans");
  revalidatePath("/app/plans");
  redirect("/admin/plans");
}
