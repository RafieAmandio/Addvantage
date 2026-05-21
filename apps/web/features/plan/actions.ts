"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { apiPost, apiPut, apiDelete } from "@/lib/api/client-server";
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
  rMultiple: nullableNumber,
  setups: setupsField,
  tags: csvArray,
  tier: PlanTierSchema,
});

export const PlanUpdateInputSchema = PlanCreateInputSchema.partial();

export const PlanCloseInputSchema = z.object({
  outcome: PlanOutcomeSchema,
  closePrice: nullableNumber,
});

function readPlanForm(fd: FormData) {
  return {
    symbol: fd.get("symbol"),
    thesis: fd.get("thesis"),
    direction: fd.get("direction"),
    entry: fd.get("entry"),
    stop: fd.get("stop"),
    target: fd.get("target"),
    rMultiple: fd.get("rMultiple"),
    setups: fd.get("setups"),
    tags: fd.get("tags"),
    tier: fd.get("tier"),
  };
}

export async function createPlan(
  _prev: PlanActionState,
  formData: FormData,
): Promise<PlanActionState> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  const parse = PlanCreateInputSchema.safeParse(readPlanForm(formData));
  if (!parse.success) {
    return {
      ok: false,
      error: parse.error.issues[0]?.message ?? "validation failed",
    };
  }

  let newId: string;
  try {
    const data = await apiPost<{ id: string }>("/plans", parse.data);
    newId = data.id;
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "insert failed" };
  }

  revalidatePath("/admin/plans");
  redirect(`/admin/plans/${newId}`);
}

export async function updatePlan(
  id: string,
  _prev: PlanActionState,
  formData: FormData,
): Promise<PlanActionState> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  const parse = PlanUpdateInputSchema.safeParse(readPlanForm(formData));
  if (!parse.success) {
    return {
      ok: false,
      error: parse.error.issues[0]?.message ?? "validation failed",
    };
  }

  try {
    await apiPut(`/plans/${id}`, parse.data);
    revalidatePath("/admin/plans");
    revalidatePath(`/admin/plans/${id}`);
    return { ok: true, id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "update failed" };
  }
}

export async function publishPlan(id: string): Promise<void> {
  await requireAdmin();
  await apiPut(`/plans/${id}/publish`);
  revalidatePath("/admin/plans");
  revalidatePath(`/admin/plans/${id}`);
  revalidatePath("/app/plan");
}

export async function closePlan(id: string, formData: FormData): Promise<void> {
  await requireAdmin();

  const parse = PlanCloseInputSchema.safeParse({
    outcome: formData.get("outcome"),
    closePrice: formData.get("closePrice"),
  });
  if (!parse.success) {
    throw new Error(parse.error.issues[0]?.message ?? "validation failed");
  }

  await apiPut(`/plans/${id}/close`, parse.data);
  revalidatePath("/admin/plans");
  revalidatePath(`/admin/plans/${id}`);
  revalidatePath("/app/plan");
  revalidatePath(`/app/plan/${id}`);
}

export async function deletePlan(id: string): Promise<void> {
  await requireAdmin();
  await apiDelete(`/plans/${id}`);
  revalidatePath("/admin/plans");
  revalidatePath("/app/plan");
  redirect("/admin/plans");
}
