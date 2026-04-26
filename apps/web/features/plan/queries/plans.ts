import { cache } from "react";
import { supabaseServer } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/auth/session";
import { PlanRowSchema, type Plan } from "@/features/plan/types";
import { isMockMode } from "@/lib/config/public";
import { mockPublishedPlans, mockPlanById } from "@/lib/mock/fixtures";

const PLAN_COLUMNS =
  "id,symbol,thesis,direction,entry,stop,target,r_multiple,setups,tags,tier,status,outcome,close_price,realized_r,author_id,created_at,updated_at,published_at,closed_at";

const DEFAULT_LIST_LIMIT = 50;

interface ListPublishedPlansInput {
  limit?: number;
  symbol?: string;
}

export async function listPublishedPlans(
  input: ListPublishedPlansInput = {},
): Promise<Plan[]> {
  const limit = input.limit ?? DEFAULT_LIST_LIMIT;
  if (isMockMode()) {
    const all = mockPublishedPlans().filter((p) => p.status === "published");
    const filtered = input.symbol
      ? all.filter((p) => p.symbol === input.symbol)
      : all;
    return filtered.slice(0, limit);
  }
  const supabase = supabaseServer();
  let query = supabase
    .from("trading_plans")
    .select(PLAN_COLUMNS)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .range(0, limit - 1);
  if (input.symbol) query = query.eq("symbol", input.symbol);

  const { data, error } = await query;
  if (error) {
    logger.error("listPublishedPlans failed", {
      error,
      scope: "plan.listPublishedPlans",
    });
    return [];
  }
  const parsed = PlanRowSchema.array().safeParse(data ?? []);
  if (!parsed.success) {
    logger.error("listPublishedPlans shape mismatch", {
      issues: parsed.error.issues,
      scope: "plan.listPublishedPlans",
    });
    return [];
  }
  return parsed.data;
}

export const getPlanById = cache(async function getPlanById(id: string): Promise<Plan | null> {
  if (isMockMode()) return mockPlanById(id);
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("trading_plans")
    .select(PLAN_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    logger.error("getPlanById failed", {
      id,
      error,
      scope: "plan.getPlanById",
    });
    return null;
  }
  if (!data) return null;
  const parsed = PlanRowSchema.safeParse(data);
  if (!parsed.success) {
    logger.error("getPlanById shape mismatch", {
      id,
      issues: parsed.error.issues,
      scope: "plan.getPlanById",
    });
    return null;
  }
  return parsed.data;
});

export async function listAllPlansForAdmin(limit = 100): Promise<Plan[]> {
  await requireAdmin();
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("trading_plans")
    .select(PLAN_COLUMNS)
    .order("updated_at", { ascending: false })
    .range(0, limit - 1);
  if (error) {
    logger.error("listAllPlansForAdmin failed", {
      error,
      scope: "plan.listAllPlansForAdmin",
    });
    return [];
  }
  const parsed = PlanRowSchema.array().safeParse(data ?? []);
  if (!parsed.success) {
    logger.error("listAllPlansForAdmin shape mismatch", {
      issues: parsed.error.issues,
      scope: "plan.listAllPlansForAdmin",
    });
    return [];
  }
  return parsed.data;
}

interface ListMyDraftPlansInput {
  limit?: number;
}

export async function listMyDraftPlans(
  input: ListMyDraftPlansInput = {},
): Promise<Plan[]> {
  const admin = await requireAdmin();
  const limit = input.limit ?? DEFAULT_LIST_LIMIT;
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("trading_plans")
    .select(PLAN_COLUMNS)
    .eq("author_id", admin.id)
    .in("status", ["draft", "closed"])
    .order("updated_at", { ascending: false })
    .range(0, limit - 1);
  if (error) {
    logger.error("listMyDraftPlans failed", {
      error,
      scope: "plan.listMyDraftPlans",
    });
    return [];
  }
  const parsed = PlanRowSchema.array().safeParse(data ?? []);
  if (!parsed.success) {
    logger.error("listMyDraftPlans shape mismatch", {
      issues: parsed.error.issues,
      scope: "plan.listMyDraftPlans",
    });
    return [];
  }
  return parsed.data;
}
